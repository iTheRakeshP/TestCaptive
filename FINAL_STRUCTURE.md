# TestCaptive Project Structure

This document outlines the final project structure after architectural consolidation.

## Root Directory
```
TestCaptive/
├── chrome-extension/          # Production Chrome extension
├── vscode-extension/          # VS Code extension (Host for Bridge Server)
├── TechSpecs/                 # Technical documentation
├── test-data/                 # Sample test data
├── generated-code/            # Output folder for generated tests
├── Test-Session/              # Saved recording sessions
├── demo.html                  # Demo web page
├── diagnostic.html            # Diagnostic tool
├── test-server.js             # Local web server for testing
├── package.json               # Root project configuration
└── README.md                  # Project documentation
```

## VS Code Extension (`vscode-extension/`)
The VS Code extension handles session management and code generation.

```
vscode-extension/
├── src/
│   ├── extension.ts           # Main entry point
│   ├── types.ts               # Shared type definitions
│   ├── test-data-manager.ts   # Session and data management
│   ├── code-generator.ts      # Test code generation engine
│   └── webview-ui/            # Webview UI components
│       ├── review-panel.ts
│       ├── setup-panel.ts
│       └── ...
├── templates/                 # Code generation templates
│   ├── selenium_template.py
│   ├── playwright_template.py
│   └── cypress_template.ts
├── package.json
└── tsconfig.json
```

## Chrome Extension (`chrome-extension/`)
Standard Manifest V3 extension that captures user interactions.

```
chrome-extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
└── src/
    ├── background.ts
    ├── content.ts
    └── ...
```

## Key Changes
1. **Removed `local-bridge/`**: The standalone Node.js server has been removed.
2. **Removed `websocket-server.ts`**: Removed real-time connection requirement.
3. **Added `types.ts`**: Centralized type definitions.
4. **Updated Workflow**: Switched to Export/Import model for simplicity.
