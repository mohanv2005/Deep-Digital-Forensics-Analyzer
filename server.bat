
@echo off
setlocal

:: Always switch to the project root (directory containing this BAT file)
cd /d "%~dp0"

:: Check for Administrator privileges
net session >nul 2>&1

if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...

    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -WorkingDirectory '%~dp0' -Verb RunAs"
    exit /b
)

echo.
echo ========================================
echo       DeepTrace API Server
echo ========================================
echo Running as Administrator.
echo.

:: Verify virtual environment
if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    pause
    exit /b 1
)

:: Run Uvicorn directly using the virtual environment
".venv\Scripts\python.exe" -m uvicorn server.main:app --host 0.0.0.0 --port 8000

pause
