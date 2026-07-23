$ErrorActionPreference = "Stop"

# =========================================================================
# CONFIGURATION VARIABLES
# =========================================================================
$serverIP      = "[2a0f:f01:208:7e7::]"
$sshKeyPath    = "C:\Users\ayala\.ssh\id_ed25519"
$targetDir     = "/langapp-stack"
$imageName     = "langapp-language-api"
$localTarPath  = Join-Path $env:TEMP "${imageName}.tar"

# =========================================================================
# STEP 1: BUILD IMAGE LOCALLY (Runs Tests, PNPM & TS inside local Docker)
# =========================================================================
Write-Host "Building Docker image locally on your PC..." -ForegroundColor Cyan
docker build -t ${imageName}:latest .
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Error "Building Docker image locally failed!"
    exit $exitCode
}

# =========================================================================
# STEP 2: EXPORT IMAGE TO TAR ARCHIVE
# =========================================================================
Write-Host "Exporting and compressing production image..." -ForegroundColor Cyan
if (Test-Path $localTarPath) { Remove-Item $localTarPath -Force }
docker save -o $localTarPath ${imageName}:latest

# =========================================================================
# STEP 3: UPLOAD IMAGE TO WEBDOCK
# =========================================================================
Write-Host "Uploading pre-built image to Webdock server over IPv6..." -ForegroundColor Cyan
scp -i $sshKeyPath $localTarPath admin@${serverIP}:${targetDir}/${imageName}.tar

# Clean up local temp tar file
Remove-Item $localTarPath -Force

# =========================================================================
# STEP 4: LOAD IMAGE AND RESTART CONTAINERS ON SERVER
# =========================================================================
Write-Host "Loading image into Webdock Docker engine and restarting stack..." -ForegroundColor Green

$remoteCommands = "cd $targetDir && " +
                  "docker load -i ${imageName}.tar && " +
                  "rm ${imageName}.tar && " +
                  "docker compose up -d"

ssh -i $sshKeyPath admin@$serverIP $remoteCommands

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "SUCCESS: Your app image was built locally and is live!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
