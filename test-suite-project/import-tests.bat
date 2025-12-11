@echo off
REM Universal test importer for Windows
REM Imports tests from Test-Code folder into all supported frameworks

echo ========================================
echo TestCaptive Universal Test Importer
echo ========================================
echo.

cd %~dp0..

echo Importing tests for all frameworks...
python shared\import-all-tests.py

pause
