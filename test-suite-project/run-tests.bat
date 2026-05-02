@echo off
echo ============================================
echo   TestCaptive - Test Runner
echo ============================================
echo.

:: Connect to the already-running Chrome with SSO session
set CHROME_CDP_URL=http://localhost:9222

:: Use the venv from this folder (NAS share)
set VENV_DIR=%~dp0.venv

if exist "%VENV_DIR%\Scripts\activate.bat" (
    call "%VENV_DIR%\Scripts\activate.bat"
) else (
    echo ERROR: Virtual environment not found at %VENV_DIR%
    echo Run setup-env.bat first to create it.
    pause
    exit /b 1
)

pytest "%~dp0" %*

echo.
echo ============================================
echo   Tests complete!
echo     Allure raw results: reports\allure-results\
echo     Smoke HTML report:  reports\report.html
echo.
echo   Generate the rich Allure report:
echo     generate-report.bat
echo ============================================
pause
