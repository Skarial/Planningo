$ErrorActionPreference = "Stop"

function Add-Failure {
  param(
    [string]$Message
  )
  $script:failures += $Message
}

function Show-Step {
  param(
    [string]$Label
  )
  Write-Host ""
  Write-Host "==> $Label"
}

$script:failures = @()

Show-Step "Vérification syntaxe JS (node --check)"
$jsFiles = Get-ChildItem -Path "./js" -Recurse -Filter "*.js" | Sort-Object FullName
foreach ($file in $jsFiles) {
  & node --check $file.FullName 2>$null
  if ($LASTEXITCODE -ne 0) {
    Add-Failure "Syntaxe invalide: $($file.FullName)"
  }
}
if ($script:failures.Count -eq 0) {
  Write-Host "OK - syntaxe JS"
}

Show-Step "Exécution tests domaine"
& node --input-type=module -e "import('./tests/run-domain-tests.js')" 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) {
  Add-Failure "Tests domaine en échec."
}

Show-Step "Scan anti-patterns"
$allJsFiles = Get-ChildItem -Path "./js" -Recurse -Filter "*.js"

$instantBehaviorHits = $allJsFiles | Select-String -Pattern "behavior\s*:\s*['""]instant['""]"
foreach ($hit in $instantBehaviorHits) {
  Add-Failure "Pattern non standard behavior:'instant' -> $($hit.Path):$($hit.LineNumber)"
}

$inlineResizeHits = $allJsFiles | Select-String -Pattern "window\.addEventListener\(\s*['""]resize['""]\s*,\s*\(\)\s*=>"
foreach ($hit in $inlineResizeHits) {
  Add-Failure "Listener resize inline potentiellement non nettoyé -> $($hit.Path):$($hit.LineNumber)"
}

$conflictScope = Get-ChildItem -Recurse -File -Include "*.js","*.css","*.html","*.md","service-worker.js"
$conflictHits = $conflictScope | Select-String -Pattern "^(<<<<<<< |>>>>>>> |=======$)"
foreach ($hit in $conflictHits) {
  Add-Failure "Marqueur de conflit détecté -> $($hit.Path):$($hit.LineNumber)"
}

if ($script:failures.Count -gt 0) {
  Write-Host ""
  Write-Host "❌ Vérification qualité KO:" -ForegroundColor Red
  $script:failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host ""
Write-Host "✅ Vérification qualité OK." -ForegroundColor Green
exit 0
