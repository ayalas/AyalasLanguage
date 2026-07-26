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
# STEP 1: COMPLIANCE CODE COMPILATION (LOCALLY)
# =========================================================================
Write-Host "Building Docker image locally..." -ForegroundColor Cyan
docker build -t ${imageName}:latest .
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Error "Building Docker image locally failed!"
    exit $exitCode
}

# =========================================================================
# STEP 2: IMAGE EXTRACTION
# =========================================================================
Write-Host "Exporting and compressing production image..." -ForegroundColor Cyan
if (Test-Path $localTarPath) { Remove-Item $localTarPath -Force }
docker save -o $localTarPath ${imageName}:latest

# =========================================================================
# STEP 3: PREPARE SERVER & UPLOAD
# =========================================================================
Write-Host "Ensuring target directory exists on server..." -ForegroundColor Cyan
ssh -i $sshKeyPath admin@$serverIP "mkdir -p $targetDir"

Write-Host "Uploading files to Webdock..." -ForegroundColor Cyan
# Upload the tarball
scp -i $sshKeyPath $localTarPath admin@${serverIP}:${targetDir}/${imageName}.tar
# Upload configs
scp -i $sshKeyPath ./docker-compose.yml admin@${serverIP}:${targetDir}/docker-compose.yml
scp -i $sshKeyPath ./langapp-stack/.env admin@${serverIP}:${targetDir}/.env
scp -i $sshKeyPath ./langapp-stack/Caddyfile admin@${serverIP}:${targetDir}/Caddyfile
# gets permission denied - moved to a separate script replace-certs.ps1
# if (Test-Path ./langapp-stack/certs) {
#   scp -i $sshKeyPath -r ./langapp-stack/certs admin@${serverIP}:${targetDir}
#}

# Clean up local tar
Remove-Item $localTarPath -Force

# =========================================================================
# STEP 4: REMOTE REFRESH & CLEANUP (SERVER-SIDE)
# =========================================================================
Write-Host "Refreshing production stack and cleaning up..." -ForegroundColor Green

# 1. Enter dir
# 2. Stop current stack (down)
# 3. Load the new image
# 4. DELETE the tar file immediately (Save space)
# 5. Prune old images (Remove the previous 'latest' which is now untagged)
# 6. Bring the stack back up
$remoteCommands = @"
    cd $targetDir && \
    sed -i 's|\./db_data|/langapp-stack/db_data|g' docker-compose.yml && \
    docker compose down && \
    docker load -i ${imageName}.tar && \
    rm ${imageName}.tar && \
    docker image prune -f && \
    docker compose up -d
"@

ssh -i $sshKeyPath admin@$serverIP $remoteCommands
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Error "Loading image into Webdock Docker engine failed!"
    exit $exitCode
}

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "SUCCESS: Production app updated and space cleaned!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green