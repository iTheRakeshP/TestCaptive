@echo off
echo ============================================
echo   TestCaptive - Environment Setup
echo   Run this ONCE from any VM to set up
echo ============================================
echo.

:: Create venv using whatever Python is available
where python >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.10+ on this machine
    echo or place embedded Python in %~dp0python\
    pause
    exit /b 1
)

echo Creating virtual environment...
python -m venv "%~dp0.venv"

echo Installing dependencies...
call "%~dp0.venv\Scripts\activate.bat"
pip install -r "%~dp0requirements.txt"

echo Installing Playwright browsers...
playwright install chromium

echo.
echo ============================================
echo   Setup complete! Now use run-tests.bat
echo ============================================
pause
