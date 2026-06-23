
# 1. Define Paths and Variables
$apiRoot      = "./apps/AyalasLanguageAPI"
$webRoot      = "./apps/AyalasLanguageWeb"
$adminRoot      = "./apps/AyalasLanguageWebAdmin"
$publishDir   = "$apiRoot/bin/Release/net9.0/publish"
$distSource   = "$webRoot/dist"
$distAdminSource   = "$adminRoot/admin"
$timestamp    = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFileName  = "AyalasLanguageV$timestamp.zip"

pnpm install
if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }

turbo test
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed! Stopping build."
    exit 1  # or 'throw' to stop the script
}

pnpm turbo build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# 2. Publish Backend (API)
Write-Host "Publishing Backend API..." -ForegroundColor Cyan
Set-Location $apiRoot
dotnet restore
if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed" }
dotnet publish -c Release /p:UseAppHost=false
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }
Set-Location ..
Set-Location ..

function Copy-Frontend {
    param (
        [string]$DisplayName,
        [string]$FrontendWebRoot,
        [string]$SourcePath
    )
    # Copy API Dist to Web Publish Directory
    Write-Host "Copying $SourcePath for $DisplayName static files serving..." -ForegroundColor Cyan
    if (Test-Path $SourcePath) {
        Copy-Item -Path $SourcePath -Destination $publishDir -Recurse -Force
    } else {
        Write-Error "Source directory $SourcePath does not exist!"
        exit 1
    }
}

# 3. Copy Frontend (Web) to dotnet publish folder
Copy-Frontend -DisplayName "Public Frontend" -FrontendWebRoot $webRoot -SourcePath $distSource

# 4. Copy Admin Frontend (WebAdmin) to dotnet publish folder
Copy-Frontend -DisplayName "Admin Frontend" -FrontendWebRoot $adminRoot -SourcePath $distAdminSource

# 5. Compress Published Files for a linux based machine (using backlashes for paths)
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
