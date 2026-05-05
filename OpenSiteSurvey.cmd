@echo off
setlocal
set "ROOT=%~dp0"
set "RUNNER=%ROOT%tools\one-click-launcher\run-site-survey.cmd"
set "LOGFILE=%TEMP%\site-survey-server.log"

if not exist "%RUNNER%" (
  echo ERROR: Runner file not found:
  echo %RUNNER%
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo ERROR: pnpm not found in PATH.
  echo Run this once in terminal: corepack enable
  pause
  exit /b 1
)

echo [SiteSurvey] Launcher started at %DATE% %TIME% > "%LOGFILE%"
echo [SiteSurvey] Root: %ROOT% >> "%LOGFILE%"

echo Starting Site Survey server in hidden detached process...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%ComSpec%' -ArgumentList '/c call ""%RUNNER%""' -WindowStyle Hidden"
if errorlevel 1 (
  echo ERROR: Failed to start background server process.
  echo Check Norton 360 exclusions and try again.
  pause
  exit /b 1
)

echo Opening site...
start "" "http://localhost:5173/"

echo Done. If the site does not load, check:
echo %LOGFILE%
timeout /t 1 >nul
