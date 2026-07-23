$ErrorActionPreference = "Stop"

# =========================================================================
# CONFIGURATION VARIABLES
# =========================================================================
$serverIP      = "[2a0f:f01:208:7e7::]"
$sshKeyPath    = "C:\Users\ayala\.ssh\id_ed25519"
$targetDir     = "/langapp-stack"

# Dynamically stamp the file name
$timestamp     = Get-Date -Format "yyyyMMdd-HHmmss"
$tarName       = "source_code_$timestamp.tar.gz"

# CRITICAL FIX: Route the file generation entirely through the Windows Temp Directory
# This bypasses local folder restriction policies completely.
$localTarPath  = Join-Path $env:TEMP $tarName

# =========================================================================
# STEP 1: COMPRESS WORKSPACE SOURCING
# =========================================================================
Write-Host "Compressing local Monorepo workspace into Temp folder..." -ForegroundColor Cyan

# Tar compression (excludes heavy local caches and artifacts)
tar --exclude="node_modules" --exclude=".turbo" --exclude="bin" --exclude="obj" --exclude=".sln" --exclude=".ps1" --exclude=".bat" --exclude=".git" --exclude="ayalaslanguageapp" --exclude="langapp-stack" --exclude="extras" --exclude="dist" --exclude="admin" -czf $localTarPath .

# =========================================================================
# STEP 2: SYNCHRONIZE FILES OVER IPV6
# =========================================================================
Write-Host "Uploading codebase archive to Webdock server..." -ForegroundColor Cyan
scp -i $sshKeyPath $localTarPath admin@${serverIP}:${targetDir}/${tarName}

# Clean up the unique temporary local file immediately
Remove-Item $localTarPath -Force

# =========================================================================
# STEP 3: REMOTE COMMAND EXECUTION (BUILD & SPIN UP STACK)
# =========================================================================
Write-Host "Executing remote build sequence via Docker on Webdock..." -ForegroundColor Green

$remoteCommands = "set -e && " +
                  "cd $targetDir && " +
                  "tar -xzf $tarName && " +
                  "rm $tarName && " +
                  "docker build -t langapp-language-api:latest . && " +
                  "docker compose up -d --build"

ssh -i $sshKeyPath admin@$serverIP $remoteCommands
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Error "Deployment pipeline failed inside the Webdock compilation engine!"
    exit $exitCode
}

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "SUCCESS: Your app is building and initializing on Webdock!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
