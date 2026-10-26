$k = Read-Host "Paste your Anthropic key, then press Enter" -AsSecureString
$plain = [System.Net.NetworkCredential]::new("", $k).Password
try {
  if ([string]::IsNullOrWhiteSpace($plain) -or -not $plain.StartsWith("sk-ant-")) {
    Write-Host "That doesn't look like an Anthropic key. Nothing was saved."
  } else {
    npx supabase secrets set "ANTHROPIC_API_KEY=$plain"
  }
} finally {
  Remove-Variable plain, k -ErrorAction SilentlyContinue
}