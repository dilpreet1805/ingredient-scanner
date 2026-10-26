param(
  [Parameter(Mandatory = $true)][string]$Path,
  [string]$Out = ".\scripts\test-body.json",
  [int]$MaxEdge = 1600
)

# Stop at the first error instead of carrying on with empty values.
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Host "File not found: $Path"
  Write-Host "Check the name with: Get-ChildItem (Split-Path '$Path')"
  exit 1
}

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $Path).Path)
try {
  $scale = [Math]::Min(1.0, $MaxEdge / [Math]::Max($src.Width, $src.Height))
  $w = [int]($src.Width * $scale)
  $h = [int]($src.Height * $scale)

  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $w, $h)
  $g.Dispose()

  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]70)

  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, $encoder, $params)
  $bytes = $ms.ToArray()
  $bmp.Dispose()

  $b64 = [Convert]::ToBase64String($bytes)
  @{ image = $b64; mediaType = "image/jpeg" } | ConvertTo-Json -Compress |
    Set-Content -Path $Out -NoNewline

  "Resized to ${w}x${h}, JPEG size: $([Math]::Round($bytes.Length / 1KB)) KB"
  "Wrote $Out (contains your photo: never commit it)"
} finally {
  if ($src) { $src.Dispose() }
}