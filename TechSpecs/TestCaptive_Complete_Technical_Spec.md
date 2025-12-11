# Project Title: TestCaptive – UI Behavior Recorder & Code Generator (VS Code + Chrome Extension)

## Objective

TestCaptive enables developers and QA engineers to automatically generate test scripts for Selenium (Python), Playwright (Python), or Cypress (TypeScript) by interacting with a live application in the browser. The tool consists of a Chrome Extension to capture user behavior and a VS Code Extension to preview and export the generated scripts.

**Architecture:** Offline/Standalone Mode. The Chrome Extension records events and saves them to a JSON file. The VS Code Extension imports this JSON file to generate code. No active network connection or local server bridge is required between the two components.

---

## Components

### 1. Chrome Extension

**Purpose:** Capture user interactions (clicks, input, form changes, etc.) and export them as a structured JSON session file.

**Preferred Language:**
- TypeScript (compiled to JavaScript)

**Reasoning:**
- TypeScript offers better type safety and tooling for managing growing complexity.
- Code will be transpiled to JavaScript using tools like `esbuild`, `webpack`, or `Vite`, ensuring compatibility with Chrome's JavaScript-only runtime.

**Features:**

- JavaScript
- Manifest V3
- Event Capture (Clicks, Inputs, Navigation, Assertions)
- Context Menu Integration (Right-click assertion capture)
- Session Export (JSON Download with assertions)

---

### 2. VS Code Extension

**Purpose:** Provide a user interface inside VS Code to import recording sessions, view events, and generate test scripts.

**UI Flow:** The extension UI is structured into a unified **Review Panel**:

#### **Review Panel**

- **Import Section**: Drag & Drop area for `.json` session files.
- **Events Section**: List of captured events with details.
- **Data Section**: Table of extracted test data (inputs, values).
- **Code Section**: 
  - Framework selection tabs (Selenium, Playwright, Cypress).
  - Code editor with syntax highlighting.
  - Copy and Export buttons.

**Interactive Features:**

- Drag-and-drop file import
- Instant code generation upon import
- Framework switching without re-importing

**Key Technologies:**

- TypeScript
- `vscode` Extension API
- Webview API for the UI

---

## User Role Simulation

TestCaptive supports launching the application with different user roles to simulate varied UI behaviors for personas such as Financial Advisor, CSA, Ops User, etc.

### Role Handling Strategy:

Since the tool is now offline/file-based, role simulation is handled during the recording phase in the browser. The user manually logs in as the desired role, and the recorder captures the interactions relevant to that role.

---

## Data Flow

1.  **User** starts recording in Chrome Extension.
2.  **Chrome Extension** captures DOM events (click, input, change).
3.  **User** optionally adds assertions via right-click context menu during recording.
4.  **User** stops recording.
5.  **Chrome Extension** compiles events and assertions into a JSON object and triggers a file download.
6.  **User** opens VS Code Extension.
7.  **User** drags the downloaded JSON file into the VS Code Extension.
8.  **VS Code Extension** parses the JSON, displays events (including assertions), and generates test code with validations using templates.

---

## Technical Stack

-   **Chrome Extension**: HTML, CSS, JavaScript (Manifest V3)
-   **VS Code Extension**: TypeScript, VS Code Webview API
-   **Build Tools**: npm, tsc, webpack (for Chrome extension)

---

## Future Enhancements

-   **AI-Powered Assertion Suggestions**: Analyze DOM changes to suggest additional assertions automatically
-   **Direct File System Access**: Allow Chrome Extension to save directly to a specific folder (requires native messaging host, optional).
-   **Cloud Sync**: Upload sessions to a cloud service for team sharing.
-   **Advanced Assertion Types**: API response validation, performance metrics, accessibility checks


