# change: add copy-images.ps1 — revert: git restore scripts/copy-images.ps1
# Usage: .\scripts\copy-images.ps1 -SourceFolder "C:\Users\manager\Desktop\images"

param(
    [Parameter(Mandatory = $true)]
    [string]$SourceFolder
)

# Validate source folder exists
if (-not (Test-Path $SourceFolder)) {
    Write-Host "ERROR: Source folder does not exist: $SourceFolder" -ForegroundColor Red
    exit 1
}

# Get script directory and resolve destination path
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$destination = Join-Path $repoRoot "frontend\public\product-images"

# Ensure destination exists
if (-not (Test-Path $destination)) {
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Write-Host "Created destination directory: $destination" -ForegroundColor Green
}

# Image file extensions to copy
$extensions = @("*.png", "*.jpg", "*.jpeg", "*.webp", "*.svg")

# Get all matching files
$filesToCopy = Get-ChildItem -Path $SourceFolder -File -Include $extensions -Recurse:$false

if ($filesToCopy.Count -eq 0) {
    Write-Host "WARNING: No image files found in source folder matching: $($extensions -join ', ')" -ForegroundColor Yellow
    exit 0
}

# Copy files
$copiedFiles = @()
foreach ($file in $filesToCopy) {
    $destPath = Join-Path $destination $file.Name
    try {
        Copy-Item -Path $file.FullName -Destination $destPath -Force
        $copiedFiles += $file.Name
        Write-Host "Copied: $($file.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Failed to copy $($file.Name): $_" -ForegroundColor Red
    }
}

# Print summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copied files:" -ForegroundColor Yellow
foreach ($fileName in $copiedFiles) {
    Write-Host "  - $fileName" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Total files copied: $($copiedFiles.Count)" -ForegroundColor Green
Write-Host "Destination: $destination" -ForegroundColor Cyan
Write-Host ""
Write-Host "SUCCESS: Image copy completed!" -ForegroundColor Green
