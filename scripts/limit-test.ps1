param(
  [Parameter(Mandatory = $true)][string]$BodyFile,
  [int]$Count = 1,
  [switch]$Parallel,
  [switch]$Pause
)

$base = "https://zkcmiuqbyrgwrxntwgkg.supabase.co"
$pub = $env:SUPABASE_PUBLISHABLE_KEY
if (-not $pub) {
  Write-Host 'Set $env:SUPABASE_PUBLISHABLE_KEY first.'
  exit 1
}

# One anonymous user for every call in this run.
$auth = Invoke-RestMethod -Method Post -Uri "$base/auth/v1/signup" `
  -Headers @{ apikey = $pub } -ContentType "application/json" -Body '{}'
$token = $auth.access_token
Write-Host "Test user id: $($auth.user.id)"

if ($Pause) {
  Write-Host "Run your SQL now, then press Enter to continue."
  Read-Host | Out-Null
}

Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [TimeSpan]::FromSeconds(120)
$body = Get-Content -Raw -Path $BodyFile
$url = "$base/functions/v1/decode-label"

function New-Request {
  $req = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Post, $url)
  $req.Headers.Add("apikey", $pub)
  $req.Headers.Add("Authorization", "Bearer $token")
  $req.Content = New-Object System.Net.Http.StringContent($body, [System.Text.Encoding]::UTF8, "application/json")
  return $req
}

function Summarize($response) {
  $status = [int]$response.StatusCode
  $text = $response.Content.ReadAsStringAsync().Result
  try { $json = $text | ConvertFrom-Json } catch { $json = $null }
  $note = ""
  if ($json.quota) {
    $note = "used=$($json.quota.used) limit=$($json.quota.limit) subscriber=$($json.quota.subscriber)"
  } elseif ($json.error) {
    $note = "error=$($json.error) limit=$($json.limit) subscriber=$($json.subscriber)"
  }
  "{0} {1}" -f $status, $note
}

$responses = @()
if ($Parallel) {
  # All requests are started before any of them is awaited, so they arrive together.
  $tasks = 1..$Count | ForEach-Object { $client.SendAsync((New-Request)) }
  [System.Threading.Tasks.Task]::WaitAll([System.Threading.Tasks.Task[]]$tasks)
  $responses = @($tasks | ForEach-Object { $_.Result })
} else {
  foreach ($n in 1..$Count) {
    $responses += $client.SendAsync((New-Request)).Result
  }
}

$n = 0
foreach ($r in $responses) {
  $n++
  "call {0}: {1}" -f $n, (Summarize $r)
}

""
$responses | Group-Object { [int]$_.StatusCode } | Sort-Object Name |
  ForEach-Object { "status {0}: {1} call(s)" -f $_.Name, $_.Count }