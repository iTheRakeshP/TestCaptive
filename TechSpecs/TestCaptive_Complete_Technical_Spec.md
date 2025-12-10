
# Project Title: TestCaptive – UI Behavior Recorder & Code Generator (VS Code + Chrome Extension)

## Objective

TestCaptive enables developers and QA engineers to automatically generate test scripts for Selenium (Python), Playwright (Python), or Cypress (TypeScript) by interacting with a live application in the browser. The tool consists of a Chrome Extension to capture user behavior and a VS Code Extension to preview and export the generated scripts in real-time.

---

## Components

### 1. Chrome Extension

**Purpose:** Capture user interactions (clicks, input, form changes, etc.) and send structured metadata to the VS Code extension via a WebSocket-based local bridge.

**Preferred Language:**
- TypeScript (compiled to JavaScript)

**Reasoning:**
- TypeScript offers better type safety and tooling for managing growing complexity.
- Code will be transpiled to JavaScript using tools like `esbuild`, `webpack`, or `Vite`, ensuring compatibility with Chrome's JavaScript-only runtime.

**Features:**

- JavaScript
- Manifest V3
- WebSocket (`ws://localhost:3000`) for real-time streaming

---

### 2. Local Bridge Server (WebSocket)

**Purpose:** Serve as a persistent, real-time communication bridge between the Chrome extension and the VS Code extension.

**Preferred Language:**
- TypeScript (compiled to JavaScript)

**Reasoning:**
- Enables strong typing and shared models/interfaces across Chrome extension and VS Code extension
- Integrates well with modern build tooling and improves maintainability for future enhancements

**Features:**

- WebSocket server that listens for events from the Chrome extension
- Maintains an open session to stream events to the VS Code extension
- Can broadcast structured test data and status updates

**Key Technologies:**

- Node.js + `ws` WebSocket library
- Runs locally on a dedicated port (e.g., `localhost:3000`)

---

### 3. VS Code Extension

**Purpose:** Provide a user interface inside VS Code to control test recording, view events in real time, and export test scripts.

**UI Flow:** The extension UI is structured into two **main pages**:

#### **Page 1 – Setup Panel**

- Framework selection dropdown (Selenium, Playwright, Cypress)
- User Role dropdown selector (e.g., Financial Advisor, CSA, Ops User)
- Input box for application URL
- Buttons:
  - **Start Recording** (launches Chrome + local server)
  - **Stop Recording** (closes session and loads results)

#### **Page 2 – Review & Export Panel**

- Left panel includes:
  - Captured event timeline (test steps)
  - “Select All” and “Deselect All” buttons
  - **Test Data Table** with editable key-value pairs
  - **Export Test Data** button
- Right panel includes:
  - Live preview of test script in selected language/framework
  - **Export Test Case** button to save final script

**Interactive Features:**

- Inline editing of test step labels and test data values
- Framework dropdown remains available at top for dynamic language switch
- Drag-and-drop support for test step reordering (optional future)

**Key Technologies:**

- TypeScript
- `vscode` Extension API
- WebSocket client
- Webview + Message passing for event display and file export

---

## User Role Simulation

TestCaptive supports launching the application with different user roles to simulate varied UI behaviors for personas such as Financial Advisor, CSA, Ops User, etc.

### Role Handling Strategy:
- The Setup Panel (Page 1) will include a **User Role dropdown selector**.
- Based on the selected role, the VS Code extension will:
  - Launch Chrome using Puppeteer with a query parameter, custom URL token, or session-specific cookie that emulates the selected user persona.
  - Allow additional header injection, login token handling, or script injection for simulating user context (if required).
- This enables UI flows to be captured as seen by that specific role.

### Role Examples:
- `?role=FA`
- `Authorization: Bearer <CSA-Token>`
- Injected JS: `localStorage.setItem('userRole', 'OPS')`

---

## Workflow

1. **User launches TestCaptive VS Code Extension**
2. **User selects test framework (Selenium, Playwright, Cypress)**
3. **User enters application URL**
4. **User clicks 'Start Recording'**
5. **Extension launches Chrome (via Puppeteer)** with TestCaptive Chrome Extension preloaded
6. **User interacts with the app** (fills forms, clicks buttons, selects values)
7. **Chrome extension captures interactions** and streams them via WebSocket
8. **User clicks 'Stop Recording'**
9. **VS Code displays review screen with captured steps, test data, and live test script preview**
10. **User selects or edits steps and data**
11. **User clicks 'Export Test Data'** (left panel) to save data file
12. **User clicks 'Export Test Case'** (right panel) to save code file

---

## Example Event Payload

```json
{
  "event": "click",
  "timestamp": "2025-05-27T22:00:00Z",
  "element": {
    "tag": "button",
    "text": "Submit",
    "id": "submitBtn",
    "class": "btn-primary",
    "data-testid": "submit-button"
  },
  "page": {
    "url": "https://app.example.com/form",
    "title": "User Registration"
  }
}
```

---

## Code Generation Logic

### Templates Used

- Handlebars / EJS / Jinja2-style templates for dynamic code rendering
- Parameter placeholders for data values, referencing external files

### Selenium (Python) Example:

```python
import json
with open('test_data.json') as f:
    data = json.load(f)

browser.find_element(By.NAME, "first_name").send_keys(data["first_name"])
time.sleep(3)
```

### Playwright (Python) Example:

```python
import json
with open('test_data.json') as f:
    data = json.load(f)

page.goto('https://app.example.com/form')
page.fill('[name="first_name"]', data['first_name'])
page.wait_for_timeout(3000)
```

### Cypress (TypeScript) Example:

```ts
cy.fixture('test_data.json').then((data) => {
  cy.get('[name="first_name"]').type(data.first_name);
  cy.wait(3000);
});
```

---

## Folder Structure

```
TestCaptive/
├── chrome-extension/
│   ├── manifest.json
│   ├── content.ts
│   └── background.ts
├── vscode-extension/
│   ├── src/
│   │   ├── extension.ts
│   │   └── webview-ui/
├── local-bridge/
│   └── websocket-server.ts
├── templates/
│   ├── selenium_template.py
│   ├── playwright_template.py
│   └── cypress_template.ts
├── test-data/
│   └── test_data.json
```

---

## Supported Frameworks (Confirmed)

- Selenium (Python)
- Playwright (Python)
- Cypress (TypeScript)

---

## Future Enhancements

- AI-powered selector optimization
- Smart assertions (e.g., toast messages, modals, redirects)
- Snapshot DOM capture for visual comparison
- GitHub Copilot or GPT model integration to enhance suggestions
- Data-driven test execution (loop over test data sets)


