@echo off
echo Building TestCaptive Extensions...
echo.

echo [1/4] Building Chrome Extension...
cd chrome-extension
call node build.js
if errorlevel 1 (
    echo Error building Chrome extension
    exit /b 1
)
echo.

echo [2/4] Installing VS Code Extension dependencies...
cd ..\vscode-extension
if not exist node_modules (
    call npm install
    if errorlevel 1 (
        echo Error installing VS Code extension dependencies
        exit /b 1
    )
)
echo.

echo [3/4] Compiling VS Code Extension...
call npm run compile
if errorlevel 1 (
    echo Error compiling VS Code extension
    exit /b 1
)
echo.

echo [4/4] Packaging VS Code Extension...
echo y | call npm run package
if errorlevel 1 (
    echo Error packaging VS Code extension
    exit /b 1
)
echo.

cd ..
echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Chrome Extension:
echo   Location: chrome-extension\dist
echo   Install: Open chrome://extensions/, enable Developer mode, click "Load unpacked", select the "dist" folder
echo.
echo VS Code Extension:
echo   Location: vscode-extension\testcaptive-1.0.0.vsix
echo   Install: In VS Code, press Ctrl+Shift+P, type "Extensions: Install from VSIX", select the .vsix file
echo.
