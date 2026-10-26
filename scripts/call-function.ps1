param(
  [Parameter(Mandatory = $true)][string]$Function,
  [string]$BodyFile
)

$base = "https://zkcmiuqbyrgwrxntwgkg.supabase.co"
$pub = $env:SUPABASE_PUBLISHABLE_KEY
if (-not $pub) {
  Write-Host 'First run:  $env:SUPABASE_PUBLISHABLE_KEY = "your publishable key"'
  exit 1
}

# A new anonymous user for every run keeps these tests independent.
$auth = Invoke-RestMethod -Method Post -Uri "$base/auth/v1/signup" `
  -Headers @{ apikey = $pub } -ContentType "application/json" -Body '{}'
$headers = @{ apikey = $pub; Authorization = "Bearer $($auth.access_token)" }

$body = if ($BodyFile) { Get-Content -Raw -Path $BodyFile } else { '{}' }

try {
  $result = Invoke-RestMethod -Method Post -Uri "$base/functions/v1/$Function" `
    -Headers $headers -ContentType "application/json" -Body $body
  $result | ConvertTo-Json -Depth 10
} catch {
  "Status: " + $_.Exception.Response.StatusCode.value__
}