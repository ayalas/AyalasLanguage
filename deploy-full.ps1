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
Write-Host "Building Docker image locally on your PC..." -ForegroundColor Cyan
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
# STEP 3: SYNCHRONIZE CONFIGURATIONS AND PRODUCTION SECRETS OVER IPV6
# =========================================================================
Write-Host "Uploading pre-built image, blueprints, and production secrets to Webdock..." -ForegroundColor Cyan
scp -i $sshKeyPath $localTarPath admin@${serverIP}:${targetDir}/${imageName}.tar
scp -i $sshKeyPath ./docker-compose.yml admin@${serverIP}:${targetDir}/docker-compose.yml

# CRITICAL UPLOAD: Sends your production environment file directly onto the host
scp -i $sshKeyPath ./.env admin@${serverIP}:${targetDir}/.env

# Clean up local temporary tar archive file
Remove-Item $localTarPath -Force

# =========================================================================
# STEP 4: REMOTE REFRESH OPERATION (SERVER-SIDE BOOT)
# =========================================================================
Write-Host "Loading image into Webdock Docker engine and refreshing production stack..." -ForegroundColor Green

# The path logic tweak updates the host storage mapping path inside your docker-compose file on the server
$remoteCommands = "cd $targetDir && " +
                  "sed -i 's|\./db_data|/langapp-stack/db_data|g' docker-compose.yml && " +
                  "docker load -i ${imageName}.tar && " +
                  "rm ${imageName}.tar && " +
                  "docker compose up -d"

ssh -i $sshKeyPath admin@$serverIP $remoteCommands
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Error "Loading image into Webdock Docker engine failed!"
    exit $exitCode
}

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "SUCCESS: Production app synchronized and running on Webdock!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green