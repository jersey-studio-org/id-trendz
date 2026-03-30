# POLISH UPDATE - PowerShell script to copy jersey images from Downloads to project
# Usage: .\scripts\copy-images-local.ps1

$sourceDir = "C:\Users\sahil\Downloads\images"
$destDir = "$PSScriptRoot\..\frontend\public\product-images"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Copy Jersey Images to Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if source directory exists
if (-not (Test-Path $sourceDir)) {
    Write-Host "ERROR: Source directory not found: $sourceDir" -ForegroundColor Red
    Write-Host "Please update the `$sourceDir variable in this script." -ForegroundColor Yellow
    exit 1
}

# Create destination directory if it doesn't exist
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Host "Created destination directory: $destDir" -ForegroundColor Green
}

# List of expected image files (from products.json)
$expectedFiles = @(
    "WhatsApp Image 2025-11-14 at 9.27.47 PM (4).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.47 PM (3).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.47 PM (2).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.47 PM (1).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.47 PM.jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.46 PM (3).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.46 PM (2).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.46 PM (1).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.46 PM.jpeg"
)

$copiedCount = 0
$missingCount = 0

Write-Host "Copying images..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $expectedFiles) {
    $sourcePath = Join-Path $sourceDir $file
    $destPath = Join-Path $destDir $file
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item $sourcePath $destPath -Force
            Write-Host "✓ Copied: $file" -ForegroundColor Green
            $copiedCount++
        }
        catch {
            Write-Host "✗ Failed to copy: $file - $_" -ForegroundColor Red
            $missingCount++
        }
    }
    else {
        Write-Host "⚠ Missing: $file" -ForegroundColor Yellow
        $missingCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copied: $copiedCount files" -ForegroundColor Green
if ($missingCount -gt 0) {
    Write-Host "Missing: $missingCount files" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Destination: $destDir" -ForegroundColor Cyan
Write-Host ""

if ($copiedCount -eq $expectedFiles.Count) {
    Write-Host "✓ All images copied successfully!" -ForegroundColor Green
}
else {
    Write-Host "⚠ Some images are missing. Please check the source directory." -ForegroundColor Yellow
}
