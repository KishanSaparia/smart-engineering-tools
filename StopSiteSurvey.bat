@echo off
setlocal

set "LOGFILE=%TEMP%\site-survey-server.log"

echo Stopping Site Survey server...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -like '*run-site-survey.cmd*' }; " ^
  "if (-not $procs) { Write-Host 'No running Site Survey server process found.'; exit 0 }; " ^
  "$count = 0; " ^
  "foreach ($p in $procs) { taskkill /PID $p.ProcessId /T /F | Out-Null; $count++ }; " ^
  "Write-Host ('Stopped ' + $count + ' Site Survey server process(es).')"

if exist "%LOGFILE%" (
  del /f /q "%LOGFILE%" >nul 2>nul
  echo Cleared log file: %LOGFILE%
)

echo Done.
timeout /t 1 >nul
