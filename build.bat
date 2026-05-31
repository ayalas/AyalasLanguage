@echo off
title Running AyalasLanguage Build Script
echo Starting build process...

:: Run the PowerShell script and bypass execution restrictions
powershell -NoProfile -ExecutionPolicy Bypass -File ".\build.ps1"

echo.
echo Process complete.
pause
