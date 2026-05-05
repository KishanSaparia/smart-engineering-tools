@echo off
setlocal
set "ROOT=%~dp0..\.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "LOGFILE=%TEMP%\site-survey-server.log"

echo [SiteSurvey] Server process started at %DATE% %TIME% >> "%LOGFILE%"
cd /d "%ROOT%" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
  echo [SiteSurvey] ERROR: Failed to cd to repo root: %ROOT% >> "%LOGFILE%"
  exit /b 1
)

set "CI=true"
set "PORT=5173"
set "BASE_PATH=/"

echo [SiteSurvey] Running pnpm install... >> "%LOGFILE%"
call pnpm install >> "%LOGFILE%" 2>&1
if errorlevel 1 (
  echo [SiteSurvey] ERROR: pnpm install failed. >> "%LOGFILE%"
  exit /b 1
)

echo [SiteSurvey] Running site-survey dev server... >> "%LOGFILE%"
call pnpm --filter @workspace/site-survey run dev >> "%LOGFILE%" 2>&1
echo [SiteSurvey] Dev server exited at %DATE% %TIME% >> "%LOGFILE%"
