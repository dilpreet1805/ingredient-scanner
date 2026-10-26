$cases = "injection", "adapter", "chutney", "chutney-blurry", "jam-front", "jam-back", "badframe", "extra1"

if (-not $env:SUPABASE_PUBLISHABLE_KEY) {
  Write-Host 'Set the key first:  $env:SUPABASE_PUBLISHABLE_KEY = "your publishable key"'
  exit 1
}

$rows = foreach ($name in $cases) {
  $file = Get-ChildItem D:\test-photos -Filter "$name.*" | Select-Object -First 1
  if (-not $file) {
    [pscustomobject]@{ Case = $name; Note = "file not found" }
    continue
  }

  powershell -ExecutionPolicy Bypass -File .\scripts\make-test-body.ps1 `
    -Path $file.FullName -Out ".\scripts\test-$name.json" | Out-Null

  $raw = powershell -ExecutionPolicy Bypass -File .\scripts\call-function.ps1 `
    -Function decode-label -BodyFile ".\scripts\test-$name.json" | Out-String

  try {
    $r = $raw | ConvertFrom-Json
    $ing = $r.reading.ingredientsText
    [pscustomobject]@{
      Case        = $name
      Ok          = $r.ok
      Reason      = $r.reason
      Missing     = ($r.missing -join ",")
      Warnings    = ($r.warnings -join ",")
      Brand       = $r.reading.brand
      Name        = $r.reading.productName
      Category    = $r.reading.category
      Kcal100     = $r.reading.per100g.energyKcal.value
      Sodium100   = $r.reading.per100g.sodiumMg.value
      OutTokens   = $r.usage.output_tokens
      Ingredients = if ($ing) { $ing.Substring(0, [Math]::Min(60, $ing.Length)) } else { $null }
    }
  } catch {
    [pscustomobject]@{ Case = $name; Note = $raw.Trim() }
  }
}

$rows | Format-List