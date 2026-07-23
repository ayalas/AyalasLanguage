# Stop the script immediately if any individual command fails
$ErrorActionPreference = "Stop"

# =========================================================================
# CONFIGURATION VARIABLES
# =========================================================================
$serverIP      = "[2a0f:f01:208:7e7::]"
$sshKeyPath    = "C:\Users\ayala\.ssh\id_ed25519"
$targetDir     = "/langapp-stack"
$tarFile       = "source_code.tar.gz"

# =========================================================================
# STEP 1: COMPRESS WORKSPACE SOURCING
# =========================================================================
Write-Host "Compressing local Monorepo workspace..." -ForegroundColor Cyan
if (Test-Path $tarFile) { Remove-Item $tarFile -Force }

# Standard tar compression (excludes dependency artifacts to keep the upload tiny)
tar --exclude="node_modules" --exclude=".turbo" --exclude="bin" --exclude="obj" --exclude=".git" --exclude="dist" --exclude="admin" -czf $tarFile .

# =========================================================================
# STEP 2: SYNCHRONIZE FILES OVER IPV6
# =========================================================================
Write-Host "Uploading codebase archive to Webdock server..." -ForegroundColor Cyan
scp -i $sshKeyPath $tarFile admin@${serverIP}:${targetDir}/

# =========================================================================
# STEP 3: REMOTE COMMAND EXECUTION (BUILD & SPIN UP STACK)
# =========================================================================
Write-Host "Executing remote build sequence via Docker on Webdock..." -ForegroundColor Green

$remoteCommands = "cd $targetDir && " +
                  "tar -xzf $tarFile && " +
                  "docker build -t langapp-language-api:latest . && " +
                  "docker compose up -d --build && " +
                  "rm $tarFile"

ssh -i $sshKeyPath admin@$serverIP $remoteCommands

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "SUCCESS: Your app is building and initializing on Webdock!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
