@echo off
REM ============================================
REM   TestCaptive - Generate Allure HTML Report
REM   Reads reports/allure-results/ -> reports/allure-html/
REM ============================================

set RESULTS_DIR=%~dp0reports\allure-results
set OUTPUT_DIR=%~dp0reports\allure-html

if not exist "%RESULTS_DIR%" (
    echo ERROR: No allure-results found at %RESULTS_DIR%
    echo Run pytest first: run-tests.bat
    pause
    exit /b 1
)

where allure >nul 2>nul
if errorlevel 1 (
    echo ERROR: Allure CLI not found in PATH.
    echo Install via:  scoop install allure
    echo          OR:  npm install -g allure-commandline
    echo          OR:  download from https://github.com/allure-framework/allure2/releases
    pause
    exit /b 1
)

echo Generating Allure report...
allure generate "%RESULTS_DIR%" -o "%OUTPUT_DIR%" --clean

if exist "%OUTPUT_DIR%\index.html" (
    echo.
    echo ============================================
    echo   Report generated at:
    echo     %OUTPUT_DIR%\index.html
    echo   Open with:  allure open "%OUTPUT_DIR%"
    echo ============================================
    start "" "%OUTPUT_DIR%\index.html"
) else (
    echo ERROR: Report generation failed.
)

pause
