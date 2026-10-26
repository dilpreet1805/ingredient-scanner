$base = "https://zkcmiuqbyrgwrxntwgkg.supabase.co"
$pub = $env:SUPABASE_PUBLISHABLE_KEY
if (-not $pub) {
  Write-Host 'Set $env:SUPABASE_PUBLISHABLE_KEY first.'
  exit 1
}

$auth = Invoke-RestMethod -Method Post -Uri "$base/auth/v1/signup" `
  -Headers @{ apikey = $pub } -ContentType "application/json" -Body '{}'
$withToken = @{ apikey = $pub; Authorization = "Bearer $($auth.access_token)" }
$keyOnly = @{ apikey = $pub }

$consume = '{"p_user":"00000000-0000-4000-8000-0000000000aa","p_day":"2030-01-01","p_user_limit":3,"p_subscriber_limit":50,"p_global_limit":1000}'
$refund = '{"p_user":"00000000-0000-4000-8000-0000000000aa","p_day":"2030-01-01"}'

function Test-Denied {
  param($Label, $Uri, $Headers, $Method = "Post", $Body = $null, [switch]$EmptyIsFine)
  try {
    $params = @{ Method = $Method; Uri = $Uri; Headers = $Headers; ContentType = "application/json" }
    if ($Body) { $params.Body = $Body }
    $r = Invoke-RestMethod @params
    $text = $r | ConvertTo-Json -Compress -Depth 3
    if ($EmptyIsFine -and ($null -eq $r -or $text -eq "[]" -or $text -eq "null")) {
      "$Label -> reachable, but no rows came back (row security is working)"
    } else {
      "$Label -> ALLOWED (BAD): $text"
    }
  } catch {
    "$Label -> denied, status " + $_.Exception.Response.StatusCode.value__
  }
}

Test-Denied "consume_decode as a signed-in user" "$base/rest/v1/rpc/consume_decode" $withToken "Post" $consume
Test-Denied "consume_decode with the key only   " "$base/rest/v1/rpc/consume_decode" $keyOnly "Post" $consume
Test-Denied "refund_decode as a signed-in user " "$base/rest/v1/rpc/refund_decode" $withToken "Post" $refund
Test-Denied "read usage_daily                  " "$base/rest/v1/usage_daily?select=*" $withToken "Get" -EmptyIsFine
Test-Denied "read user_plans                   " "$base/rest/v1/user_plans?select=*" $withToken "Get" -EmptyIsFine