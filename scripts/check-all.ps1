$failed = @()

function Run($name, [scriptblock]$command) {
  Write-Host ""
  Write-Host "== $name"
  & $command
  if ($LASTEXITCODE -ne 0) { $script:failed += $name }
}

$cfg = "supabase/functions/decode-label/deno.json"

Run "App types"        { npx tsc --noEmit }
Run "App tests"        { npm test }
Run "Function types"   { deno check --config $cfg supabase/functions/decode-label/index.ts }
Run "Function tests"   { deno test --config $cfg supabase/functions/decode-label/ }
Run "Config guard"     { deno test --allow-read supabase/tests/ }

Write-Host ""
if ($failed.Count -eq 0) {
  Write-Host "ALL CHECKS PASSED" -ForegroundColor Green
} else {
  Write-Host ("FAILED: " + ($failed -join ", ")) -ForegroundColor Red
  exit 1
}