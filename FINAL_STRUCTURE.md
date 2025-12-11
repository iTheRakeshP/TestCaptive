# TestCaptive Project Structure

This document outlines the final project structure after architectural consolidation.

## Root Directory
```
TestCaptive/
├── chrome-extension/          # Production Chrome extension
├── vscode-extension/          # VS Code extension
├── architecture/              # PlantUML diagrams and architecture docs
├── TechSpecs/                 # Technical documentation
├── test-data/                 # Sample test data
├── generated-code/            # Output folder for generated tests
├── Test-Session/              # Saved recording sessions
├── demo.html                  # Demo web page
├── diagnostic.html            # Diagnostic tool
├── ASSERTIONS_GUIDE.md        # Assertion feature documentation
├── ENTERPRISE_PITCH.md        # Business case and pitch materials
├── package.json               # Root project configuration
└── README.md                  # Project documentation
```

## VS Code Extension (`vscode-extension/`)
The VS Code extension handles session management and code generation.

```
vscode-extension/
├── src/
│   ├── extension.ts           # Main entry point
│   ├── types.ts               # Shared type definitions (includes Assertion types)
│   ├── test-data-manager.ts   # Session and data management
│   ├── code-generator.ts      # Test code generation engine with assertion support
│   └── webview-ui/            # Webview UI components
│       ├── review-panel.ts    # Main UI panel (displays assertions with ✅ icon)
│       └── ...
├── templates/                 # Code generation templates
│   ├── selenium_template.py   # With assertion generation
│   ├── playwright_template.py # With assertion generation
│   └── cypress_template.ts    # With assertion generation
├── package.json
└── tsconfig.json
```

## Chrome Extension (`chrome-extension/`)
Standard Manifest V3 extension that captures user interactions and assertions.

```
chrome-extension/
├── manifest.json              # Includes context menu permissions
├── background.js              # Context menu creation and assertion handling
├── content.js                 # Event + assertion capture with right-click support
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
5. **✅ Added Assertion Feature**: 
   - Context menu in Chrome extension (7 assertion types)
   - Assertion type definitions in types.ts
   - Assertion display in review panel
   - Assertion code generation in all 3 templates
   - Visual feedback during capture
