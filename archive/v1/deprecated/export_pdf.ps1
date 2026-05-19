param(
  [string]$HtmlPath = "out\daily_report.html",
  [string]$OutDir = "out"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Find-Edge {
  $candidates = @(
    "$Env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${Env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
  )
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  throw "msedge.exe not found. Install Microsoft Edge."
}

$edge = Find-Edge
$abs = (Resolve-Path $HtmlPath).Path

function PrintPdf([string]$Mode, [string]$Name) {
  $url = "file:///$($abs -replace '\\','/')?expand=$Mode"
  $pdf = Join-Path $OutDir $Name
  & $edge --headless --disable-gpu --no-first-run --print-to-pdf="$pdf" "$url" 2>&1 | Out-Null
  Start-Sleep -Seconds 3
  if (!(Test-Path $pdf)) { throw "PDF not created: $pdf" }
  Write-Output "  Created: $pdf"
}

PrintPdf "none" "daily_report_collapsed.pdf"
PrintPdf "all"  "daily_report_full.pdf"

Write-Output "PDFs written to $OutDir"
