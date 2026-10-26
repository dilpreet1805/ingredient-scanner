param(
  [Parameter(Mandatory = $true)][string]$BodyFile,
  [int]$Runs = 5
)

$base = "https://zkcmiuqbyrgwrxntwgkg.supabase.co"
$pub = $env:SUPABASE_PUBLISHABLE_KEY
if (-not $pub) {
  Write-Host 'Set $env:SUPABASE_PUBLISHABLE_KEY first.'
  exit 1
}

$auth = Invoke-RestMethod -Method Post -Uri "$base/auth/v1/signup" `
  -Headers @{ apikey = $pub } -ContentType "application/json" -Body '{}'
$headers = @{ apikey = $pub; Authorization = "Bearer $($auth.access_token)" }
$body = Get-Content -Raw -Path $BodyFile

$rows = foreach ($i in 1..$Runs) {
  try {
    $r = Invoke-RestMethod -Method Post -Uri "$base/functions/v1/decode-label" `
      -Headers $headers -ContentType "application/json" -Body $body
    $p = $r.reading.nutrition.values
    [pscustomobject]@{
      Run      = $i
      Basis    = $r.reading.nutrition.basis
      Kcal     = $p.energyKcal.value
      Protein  = $p.proteinG.value
      Carbs    = $p.carbsG.value
      Fat      = $p.fatG.value
      Added    = $p.addedSugarG.value
      Sodium   = $p.sodiumMg.value
      Warnings = ($r.warnings -join ",")
    }
  } catch {
    [pscustomobject]@{ Run = $i; Kcal = "Status " + $_.Exception.Response.StatusCode.value__ }
  }
}

$rows | Format-Table -AutoSize