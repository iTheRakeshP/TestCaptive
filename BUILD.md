# Building TestCaptive Extensions

This guide explains how to build both the Chrome Extension and VS Code Extension (VSIX).

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

---

## 🌐 Chrome Extension

### Install Dependencies

```bash
cd chrome-extension
npm install
```

### Build the Extension

```bash
npm run build
```

This creates a `dist` folder with all necessary files.

### Package as ZIP (for Chrome Web Store)

```bash
npm run package
```

This creates `testcaptive-chrome-extension.zip` ready for upload to Chrome Web Store.

### Load in Chrome (Development)

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension/dist` folder

### Clean Build

```bash
npm run clean
```

---

## 🔧 VS Code Extension (VSIX)

### Install Dependencies

```bash
cd vscode-extension
npm install
```

### Compile TypeScript

```bash
npm run compile
```

This compiles TypeScript files from `src/` to `out/`.

### Build VSIX Package

```bash
npm run package
```

This creates a `.vsix` file (e.g., `testcaptive-1.0.0.vsix`).

### Install VSIX in VS Code

**Option 1: Command Line**
```bash
code --install-extension testcaptive-1.0.0.vsix
```

**Option 2: VS Code UI**
1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X)
3. Click `...` menu → `Install from VSIX...`
4. Select the `.vsix` file

### Development Mode

For development with auto-recompile:

```bash
npm run watch
```

Then press `F5` in VS Code to launch Extension Development Host.

### Clean Build

```bash
npm run clean
```

---

## 📦 Quick Build (Both Extensions)

From the root directory:

```bash
# Build Chrome Extension
cd chrome-extension && npm install && npm run build && cd ..

# Build VS Code Extension
cd vscode-extension && npm install && npm run package && cd ..
```

---

## 🚀 Distribution

### Chrome Extension
- **Development**: Load unpacked from `dist` folder
- **Production**: Upload `testcaptive-chrome-extension.zip` to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

### VS Code Extension
- **Development**: Install `.vsix` file locally
- **Production**: Publish to [Visual Studio Marketplace](https://marketplace.visualstudio.com/)

---

## Troubleshooting

### Chrome Extension Issues

**Problem**: Extension not loading
- Ensure all required files are in `dist` folder
- Check `manifest.json` for syntax errors
- Look at Chrome console for errors

### VS Code Extension Issues

**Problem**: TypeScript compilation errors
```bash
npm run clean
npm install
npm run compile
```

**Problem**: VSIX packaging fails
- Ensure `@vscode/vsce` is installed
- Check `package.json` has required fields
- Verify `out` folder exists with compiled files

**Problem**: Missing dependencies
```bash
npm install
```

---

## File Structure

### Chrome Extension
```
chrome-extension/
├── dist/              # Build output (generated)
├── src/               # TypeScript source files
├── background.js      # Service worker
├── content.js         # Content script
├── popup.html         # Extension popup
├── popup.js           # Popup logic
├── manifest.json      # Extension manifest
├── build.js           # Build script
└── package.json       # npm configuration
```

### VS Code Extension
```
vscode-extension/
├── out/               # Compiled output (generated)
├── src/               # TypeScript source files
├── templates/         # Test code templates
├── package.json       # Extension manifest
├── tsconfig.json      # TypeScript config
└── *.vsix            # Built extension (generated)
```
