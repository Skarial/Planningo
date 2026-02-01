# ===============================
# BUMP APP VERSION (PLANNING)
# ===============================

$appPath = "js/app.js"
$swPath = "service-worker.js"
$placeholder = "__APP_VERSION__"

$appContent = Get-Content $appPath -Raw

if ($appContent -notmatch 'export const APP_VERSION = "(\d+)\.(\d+)\.(\d+)"') {
    Write-Error "APP_VERSION introuvable dans app.js"
    exit 1
}

$major = $matches[1]
$minor = $matches[2]
$patch = [int]$matches[3] + 1
$newVersion = "$major.$minor.$patch"

# --- APP VERSION ---
$appContent = $appContent -replace `
    'export const APP_VERSION = "\d+\.\d+\.\d+"', `
    "export const APP_VERSION = `"$newVersion`""

Set-Content $appPath $appContent
git add $appPath

Write-Host "APP_VERSION mise à jour -> $newVersion"

# --- SERVICE WORKER PLANNING ---
$swContent = Get-Content $swPath -Raw

if ($swContent -notmatch $placeholder) {
    Write-Error "Le placeholder __APP_VERSION__ doit rester dans service-worker.js"
    exit 1
}

$swInjected = $swContent -replace $placeholder, $newVersion
Set-Content $swPath $swInjected
git add $swPath

# Restauration immédiate du placeholder
Set-Content $swPath $swContent
git add $swPath
$swContentRestored = Get-Content $swPath -Raw
if ($swContentRestored -notmatch $placeholder) {
    Write-Error "Le placeholder __APP_VERSION__ doit rester dans service-worker.js apres restauration"
    exit 1
}


Write-Host "CACHE_VERSION synchronisée via placeholder"

# ===============================
# BUMP GENERATOR VERSION (ISOLÉ)
# ===============================

$genVersionPath = "tools/generator-activation/GENERATOR_VERSION.txt"
$genSwPath = "tools/generator-activation/service-worker.js"
$genPlaceholder = "__GENERATOR_VERSION__"

if (-not (Test-Path $genVersionPath)) {
    Write-Error "GENERATOR_VERSION.txt introuvable"
    exit 1
}

$genVersion = (Get-Content $genVersionPath -Raw).Trim()


if ($genVersion -notmatch '^(\d+)\.(\d+)\.(\d+)$') {
    Write-Error "Version générateur invalide"
    exit 1
}

$genMajor = $matches[1]
$genMinor = $matches[2]
$genPatch = [int]$matches[3] + 1
$newGenVersion = "$genMajor.$genMinor.$genPatch"

Set-Content $genVersionPath $newGenVersion
git add $genVersionPath

Write-Host "GENERATOR_VERSION mise à jour -> $newGenVersion"

# --- SERVICE WORKER GENERATOR ---
$genSwContent = Get-Content $genSwPath -Raw

if ($genSwContent -notmatch $genPlaceholder) {
    Write-Error "__GENERATOR_VERSION__ absent du service-worker générateur"
    exit 1
}

$genSwInjected = $genSwContent -replace $genPlaceholder, $newGenVersion
Set-Content $genSwPath $genSwInjected
git add $genSwPath

# Restauration immédiate du placeholder
Set-Content $genSwPath $genSwContent
git add $genSwPath

Write-Host "CACHE générateur synchronisé via placeholder"
