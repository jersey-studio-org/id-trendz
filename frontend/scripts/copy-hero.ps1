# PowerShell script to copy hero image to frontend assets
# Edit the $sourceImagePath variable below with your image path, then run this script

# ============================================
# EDIT THIS PATH WITH YOUR HERO IMAGE LOCATION
# ============================================
$sourceImagePath = "C:\Users\sahil\Downloads\your-hero-image.png"

# Destination path (do not edit)
$destinationPath = Join-Path $PSScriptRoot "..\frontend\src\assets\hero\hero-image.png"

# Check if source file exists
if (-not (Test-Path $sourceImagePath)) {
    Write-Host "ERROR: Source image not found at:" -ForegroundColor Red
    Write-Host $sourceImagePath -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please edit the `$sourceImagePath variable in this script with your actual image path." -ForegroundColor Yellow
    exit 1
}

# Create destination directory if it doesn't exist
$destDir = Split-Path $destinationPath -Parent
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

# Copy the file
try {
    Copy-Item -Path $sourceImagePath -Destination $destinationPath -Force
    Write-Host "SUCCESS: Hero image copied to:" -ForegroundColor Green
    Write-Host $destinationPath -ForegroundColor Cyan
    Write-Host ""
    Write-Host "File size: $((Get-Item $destinationPath).Length / 1MB) MB" -ForegroundColor Gray
}
catch {
    Write-Host "ERROR: Failed to copy image:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    exit 1
}
