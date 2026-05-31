# 1. Define Paths and Variables
$apiRoot      = "./AyalasLanguageAPI"
$webRoot      = "./AyalasLanguageWeb"
$publishDir   = "$apiRoot/bin/Release/net10.0/publish"
$distSource   = "$webRoot/dist"
$timestamp    = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFileName  = "AyalasLanguageV$timestamp.zip"

# 2. Build Backend (API)
Write-Host "Building Backend API..." -ForegroundColor Cyan
Set-Location $apiRoot
dotnet restore
dotnet publish -c Release /p:UseAppHost=false
Set-Location ..

# 3. Build Frontend (Web)
Write-Host "Building Frontend Web..." -ForegroundColor Cyan
Set-Location $webRoot
npm install
npm run build
Set-Location ..

# 4. Copy API Dist to Web Publish Directory
Write-Host "Copying API dist to frontend publish directory..." -ForegroundColor Cyan
if (Test-Path $distSource) {
    Copy-Item -Path $distSource -Destination $publishDir -Recurse -Force
} else {
    Write-Warning "Source directory $distSource does not exist!"
}

# 5. Compress Published Files
Write-Host "Creating deployment zip archive..." -ForegroundColor Cyan
if (Test-Path $publishDir) {
    Compress-Archive -Path "$publishDir\*" -DestinationPath "./$zipFileName" -Force
    Write-Host "Success! Created archive: $zipFileName" -ForegroundColor Green
} else {
    Write-Error "Publish directory $publishDir not found. Cannot create zip."
}
