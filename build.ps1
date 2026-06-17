
# 1. Define Paths and Variables
$apiRoot      = "./AyalasLanguageAPI"
$webRoot      = "./AyalasLanguageWeb"
$adminRoot      = "./AyalasLanguageWebAdmin"
$publishDir   = "$apiRoot/bin/Release/net9.0/publish"
$distSource   = "$webRoot/dist"
$distAdminSource   = "$webRoot/admin"
$timestamp    = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFileName  = "AyalasLanguageV$timestamp.zip"

# 2. Build Backend (API)
Write-Host "Building Backend API..." -ForegroundColor Cyan
Set-Location $apiRoot
dotnet restore
dotnet publish -c Release /p:UseAppHost=false
Set-Location ..

function Build-Frontend {
    param (
        [string]$DisplayName,
        [string]$FrontendWebRoot,
        [string]$TargetPath
    )

    # Build Frontend (Web)
    Write-Host "Building $DisplayName..." -ForegroundColor Cyan
    Set-Location $FrontendWebRoot

    # Optional: Ensure the script stops if npm install fails
    npm install
    if ($LASTEXITCODE -ne 0) { throw "$DisplayName npm install failed" }

    # Run tests before building
    Write-Host "Running Tests for $DisplayName..." -ForegroundColor Yellow
    npx vitest run
    if ($LASTEXITCODE -ne 0) {
        Write-Error "$DisplayName Tests failed! Stopping build."
        exit 1  # or 'throw' to stop the script
    }

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "$DisplayName Build failed" }

    Set-Location ..

    # Copy API Dist to Web Publish Directory
    Write-Host "Copying API dist to $DisplayName static files serving folder..." -ForegroundColor Cyan
    if (Test-Path $TargetPath) {
        Copy-Item -Path $TargetPath -Destination $publishDir -Recurse -Force
    } else {
        Write-Error "Source directory $TargetPath does not exist!"
        exit 1
    }
}

# 3. Build Frontend (Web)
Build-Frontend -DisplayName "Public Frontend" -FrontendWebRoot $webRoot -TargetPath $distSource

# 4. Build Admin Frontend (WebAdmin)
Build-Frontend -DisplayName "Admin Frontend" -FrontendWebRoot $adminRoot -TargetPath $distAdminSource

# 5. Compress Published Files for a linux based machine
Write-Host "Creating deployment zip archive..." -ForegroundColor Cyan
if (Test-Path $publishDir) {
    # 1. CRITICAL: Convert relative path to an absolute path so the substring math works
    $absolutePublishDir = (Resolve-Path $publishDir).Path

    # Ensure it ends with a single backslash for clean string slicing
    $basePath = $absolutePublishDir.TrimEnd("\") + "\"

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    # Open a new, empty zip archive
    $stream = [System.IO.File]::OpenWrite("./$zipFileName")
    $archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)

    # Get all files in the publish directory
    $files = Get-ChildItem -Path $absolutePublishDir -Recurse -File

    foreach ($file in $files) {
        # Calculate the relative path inside the zip
        $relativePath = $file.FullName.Substring($basePath.Length)
        
        # CRITICAL: Force the path inside the zip to use Linux forward slashes
        $linuxPath = $relativePath.Replace("\", "/")
        
        # Create the entry and copy the file data
        $entry = [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $linuxPath)
    }

    # Clean up and close the files
    $archive.Dispose()
    $stream.Dispose()

    Write-Host "Success! Created archive: $zipFileName" -ForegroundColor Green
} else {
    Write-Error "Publish directory $publishDir not found. Cannot create zip."
}
