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
# STEP 3: UPLOAD CODES & STACK CONFIGURATIONS TO WEBDOCK OVER IPV6
# =========================================================================
Write-Host "Uploading pre-built image and stack blueprints to Webdock..." -ForegroundColor Cyan
scp -i $sshKeyPath $localTarPath admin@${serverIP}:${targetDir}/${imageName}.tar
scp -i $sshKeyPath ./docker-compose.yml admin@${serverIP}:${targetDir}/docker-compose.yml
scp -i $sshKeyPath ./mysql-limits.cnf admin@${serverIP}:${targetDir}/mysql-limits.cnf

# Clean up local temporary tar archive
Remove-Item $localTarPath -Force

# =========================================================================
# STEP 4: LOAD IMAGE AND OVERWRITE RUNTIME CONTAINER STATES ON SERVER
# =========================================================================
Write-Host "Loading image into Webdock Docker engine and refreshing stack..." -ForegroundColor Green

# The path logic tweak replaces local relative mounts (./) with absolute paths (/langapp-stack/) on the server
$remoteCommands = "cd $targetDir && " +
                  "sed -i 's|\./local_db_data|/langapp-stack/db_data|g' docker-compose.yml && " +
                  "sed -i 's|\./mysql-limits.cnf|/langapp-stack/mysql-limits.cnf|g' docker-compose.yml && " +
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
Write-Host "SUCCESS: Stack sync completed and refreshed on Webdock!"  -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
