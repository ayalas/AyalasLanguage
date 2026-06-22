
# 1. Define Paths and Variables
$apiRoot      = "./apps/AyalasLanguageAPI"
$publishDir   = "$apiRoot/bin/Release/net9.0/publish"
$timestamp    = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFileName  = "AyalasLanguageV$timestamp.zip"

# 2. Publish Backend (API)
Write-Host "Publishing Backend API..." -ForegroundColor Cyan
Set-Location $apiRoot
dotnet restore
if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed" }
dotnet publish -c Release /p:UseAppHost=false
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }
Set-Location ..
Set-Location ..

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
