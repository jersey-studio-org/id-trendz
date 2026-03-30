[CmdletBinding()]
param(
    [switch]$Deploy
)

$ErrorActionPreference = 'Stop'

function Exit-WithError {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

if ($Deploy) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Frontend Build (Production)" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Frontend Development Server" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Add common Node.js install locations for Windows.
$env:PATH += ";C:\Program Files\nodejs\;$env:APPDATA\npm"

Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
}
catch {
    Exit-WithError "Node.js is not installed or not in PATH. Install from https://nodejs.org/ and retry."
}

Write-Host ""
Write-Host "Installing root dependencies (workspace mode)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "npm install failed."
}

if (Test-Path ".\frontend\node_modules") {
    Write-Host ""
    Write-Host "Removing nested frontend node_modules to keep one root node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".\frontend\node_modules"
}

if ($Deploy) {
    Write-Host ""
    Write-Host "Building frontend for deployment..." -ForegroundColor Yellow
    npm run deploy:frontend
    if ($LASTEXITCODE -ne 0) {
        Exit-WithError "Frontend build failed."
    }
    
    Write-Host ""
    Write-Host "Frontend build is ready in frontend/dist" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "Server will be available at: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Opening browser in 2 seconds..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    # Wait a moment then open browser
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173"
    
    # Start the development server
    npm run dev:frontend
}
