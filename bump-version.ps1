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

Write-Host "APP_VERSION mise a jour -> $newVersion"

# --- SERVICE WORKER PLANNING ---
$swContent = Get-Content $swPath -Raw

if ($swContent -notmatch $placeholder) {
    Write-Error "Le placeholder __APP_VERSION__ doit rester dans service-worker.js"
    exit 1
}

$swInjected = $swContent -replace $placeholder, $newVersion
Set-Content $swPath $swInjected
git add $swPath

# Restauration immediate du placeholder
Set-Content $swPath $swContent
git add $swPath
$swContentRestored = Get-Content $swPath -Raw
if ($swContentRestored -notmatch $placeholder) {
    Write-Error "Le placeholder __APP_VERSION__ doit rester dans service-worker.js apres restauration"
    exit 1
}

Write-Host "CACHE_VERSION synchronisee via placeholder"
