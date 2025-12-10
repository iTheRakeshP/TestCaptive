# TestCaptive - Professional UI Behavior Recording Tool

![TestCaptive Logo](https://img.shields.io/badge/TestCaptive-v1.0.0-blue) ![Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

**TestCaptive** is a comprehensive UI behavior recording tool that captures user interactions in web browsers and automatically generates test automation scripts for Selenium, Playwright, and Cypress frameworks.

## 🚀 **Features**

### **Core Functionality**
- ✅ **Real-time Event Capture** - Records clicks, inputs, form submissions, and navigation
- ✅ **Multi-Framework Support** - Generates code for Selenium (Python), Playwright (Python), and Cypress (TypeScript)
- ✅ **Professional VS Code Integration** - Clean, modern extension UI with split-pane layout
- ✅ **Automatic Test Data Extraction** - Captures form data and variables for parameterized tests
- ✅ **Cross-Browser Compatibility** - Works with Chrome, Edge, and other Chromium-based browsers
- ✅ **Session Management** - Save, load, and replay recording sessions
- ✅ **Code Export & Copy** - Export generated code or copy to clipboard
- ✅ **Data Export** - Export captured test data as JSON

### **Professional UI**
- 🎯 **Left Panel**: Setup & Recording Controls
- 📊 **Right Panel**: Three organized sections:
  1. **Captured Events** - Real-time event display with color-coded icons
  2. **Extracted Test Data** - Key-value pairs with export functionality## 📁 **Project Structure**

```
TestCaptive/
├── 📁 chrome-extension/          # Production Chrome extension (ACTIVE)
│   ├── manifest.json            # Manifest v3 configuration
│   ├── background.js            # Service worker for session management
│   ├── content.js               # Main content script for event capture
│   └── popup.html/js           # Extension popup UI
│
├── 📁 vscode-extension/          # VS Code extension (ACTIVE)
│   ├── src/
│   │   ├── extension.ts         # Main extension entry point
│   │   ├── websocket-server.ts  # Embedded Bridge server
│   │   ├── test-data-manager.ts # Session and data management
│   │   ├── code-generator.ts    # Test code generation engine
│   │   └── webview-ui/
│   │       └── review-panel.ts  # Main UI panel (split-pane layout)
│   ├── templates/               # Code generation templates
│   │   ├── selenium_template.py
│   │   ├── playwright_template.py
│   │   └── cypress_template.ts
│   ├── package.json
│   └── testcaptive-1.0.0.vsix  # Installable extension package
│
├── 📁 TechSpecs/                # Technical documentation
│   └── TestCaptive_Complete_Technical_Spec.md
│
├── 📁 test-data/                # Sample test data
│   └── sample_test_data.json
│
├── 📄 demo.html                 # Demo web page for testing
├── 📄 diagnostic.html           # Diagnostic tool for troubleshooting
├── 📄 test-server.js           # Local web server for testing
├── 📄 package.json             # Root project configuration
└── 📄 README.md                # This file
```

## 🛠️ **Components Overview**

### 🌐 **Chrome Extension** (`chrome-extension/`)
- **Purpose**: Records user interactions in real-time
- **Features**: DOM event capture, CSS selector generation, WebSocket communication
- **Files**: manifest.json, background.js, content.js, popup.html/js
- **Browser Support**: Chrome, Edge, Chromium-based browsers

### 📝 **VS Code Extension** (`vscode-extension/`)
- **Purpose**: Professional UI for session management and code generation
- **Features**: 
  - Split-pane interface (Setup | Events/Data/Code)
  - Event display with color-coded icons
  - Multi-framework code generation
  - Test data extraction and export
  - Session persistence and management
- **Package**: testcaptive-1.0.0.vsix (ready for installation)

### 📋 **Code Generation Templates**
- **Selenium (Python)**: WebDriver-based test scripts with explicit waits
- **Playwright (Python)**: Modern browser automation with async/await support  
- **Cypress (TypeScript)**: End-to-end testing with built-in assertions
- **Customizable**: Handlebars-style templates support variable substitution

## Prerequisites

- Node.js 18+ and npm
- Visual Studio Code
- Google Chrome browser
- Python 3.8+ (for generated Selenium/Playwright tests)

## Installation & Setup

### 1. Clone and Setup Project
```powershell
git clone <repository-url>
cd TestCaptive
```

### 2. Install Chrome Extension Dependencies
```powershell
cd chrome-extension
npm install
npm run build
```

### 3. Install VS Code Extension Dependencies
```powershell
cd ../vscode-extension
npm install
npm run compile
```

### 4. Load Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension/dist` folder

### 5. Install VS Code Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click "..." menu > "Install from VSIX..."
4. Package the vscode-extension folder or install in development mode

## Usage

### Step 1: Open VS Code Extension
1. Open VS Code
2. Open the TestCaptive panel from the Activity Bar
3. Use the Setup panel to configure your recording session

### Step 2: Start Recording
1. In VS Code Setup panel:
   - Enter the application URL you want to test
   - Select the test framework (Selenium/Playwright/Cypress)
   - Set user role (optional)
   - Click "Start Recording"

2. The Chrome extension popup will show connection status
3. Navigate to your application and perform the actions you want to record

### Step 3: Review and Generate Tests
1. Stop recording when finished
2. **Export Session**: In the Chrome Extension, click "Export JSON" to save your session.
3. **Import Session**: In VS Code, use the "Import Session" button to load the JSON file.
4. Review captured events and modify test data as needed
5. Generate test code for your chosen framework
6. Export the generated test file

## 🚀 **Quick Start Guide**

### **Prerequisites**
- **Node.js** v16+ and npm
- **VS Code** v1.74+
- **Chrome/Edge** browser

### **Installation (5 minutes)**

#### **Step 1: Install VS Code Extension**
```bash
# From project root
cd vscode-extension

# Install the extension
code --install-extension testcaptive-1.0.0.vsix
```

#### **Step 2: Load Chrome Extension**
1. Open Chrome/Edge browser
2. Navigate to `chrome://extensions/` 
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** button
5. Select the `chrome-extension` folder
6. Extension should appear with TestCaptive icon

#### **Step 3: Start Demo Server** (Optional)
```bash
# From project root - for testing with demo page
node test-server.js
```
*Demo page available at: http://localhost:8080*

### **Usage Workflow**

#### **🎬 Recording a Session**
1. **Open VS Code**
   - Press `Ctrl+Shift+P` → Type `TestCaptive: Start` → Enter
   - VS Code extension panel opens with split-pane interface
   - **Note:** The extension automatically starts the Bridge Server on port 3000.

2. **Verify Connection**
   - Left panel should show: ✅ "Connected to Bridge Server"
   - If not connected, ensure port 3000 is free and refresh

3. **Configure Recording**
   - Enter target URL in "Application URL" field
   - Click **🔄 Refresh Connection** if needed
   - Click **▶️ Start Recording**

4. **Interact with Web Application**
   - Navigate to your target web application
   - Perform user actions: fill forms, click buttons, navigate pages
   - Watch events appear in real-time in "Captured Events" section

5. **Stop & Review**
   - Click **⏹️ Stop Recording** when complete
   - Review captured events in the right panel
   - Check extracted test data from form inputs

#### **⚡ Code Generation**
1. **Select Framework**
   - Choose from: Selenium, Playwright, or Cypress tabs
   - Framework selection saves with session

2. **Generate Test Code**
   - Click **Generate Code** button
   - Code appears in the code editor panel
   - Status shows generation success

3. **Export Results**
   - **Copy Code**: Copies generated code to clipboard
   - **Export Data**: Saves test data as JSON file
   - Code can be saved as .py or .ts file via export

### **🎯 Example Generated Output**

#### **Selenium Example**
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_form_submission():
    driver = webdriver.Chrome()
    driver.get("http://localhost:8080")
    
    # Fill form fields
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "firstName"))
    ).send_keys("John")
    
    driver.find_element(By.ID, "lastName").send_keys("Doe")
    driver.find_element(By.ID, "email").send_keys("john.doe@example.com")
    
    # Submit form
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    driver.quit()

if __name__ == "__main__":
    test_form_submission()
```

#### **Extracted Test Data**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john.doe@example.com",
  "phone": "555-1234"
}
```

## Generated Test Structure

### Selenium Example
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestCapture:
    def setup_method(self):
        self.driver = webdriver.Chrome()
        self.wait = WebDriverWait(self.driver, 10)
    
    def test_user_workflow(self):
        # Navigate to application
        self.driver.get("https://example.com/login")
        
        # Login flow
        username_field = self.wait.until(EC.presence_of_element_located((By.ID, "username")))
        username_field.click()
        username_field.send_keys("testuser@example.com")
        
        # ... more generated code
```

### Playwright Example
```python
import asyncio
from playwright.async_api import async_playwright

async def test_user_workflow():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Navigate and interact
        await page.goto("https://example.com/login")
        await page.click("#username")
        await page.fill("#username", "testuser@example.com")
        
        # ... more generated code
```

### Cypress Example
```typescript
describe('User Workflow Test', () => {
  it('should complete user login flow', () => {
    cy.visit('https://example.com/login');
    
    cy.get('#username').click();
    cy.get('#username').type('testuser@example.com');
    
    // ... more generated code
  });
});
```

## Configuration

### Bridge Server Configuration
The bridge server is now embedded within the VS Code extension.
- Port: Default 3000 (Configurable via VS Code Settings)

### Template Customization
Templates are located in the `templates/` folder and use Handlebars-style syntax:
- `{{events}}` - Loop through captured events
- `{{testData}}` - Access test data variables
- `{{applicationUrl}}` - Application URL
- `{{userRole}}` - User role for the session

### VS Code Extension Settings
Configure in VS Code settings:
- `testcaptive.bridgeServerPort` - Bridge server port (default: 3000)
- `testcaptive.defaultFramework` - Default testing framework

## Troubleshooting

### Bridge Server Connection Issues
- Ensure port 3000 is not in use by another application
- Check VS Code Output panel for "TestCaptive" logs
- Verify WebSocket URL in browser console

### Chrome Extension Not Recording
- Check if extension is loaded and enabled
- Verify VS Code extension is running (Bridge Server)
- Check browser console for errors

### VS Code Extension Issues
- Ensure TypeScript compilation succeeded
- Check VS Code developer console (Help > Toggle Developer Tools)
- Verify extension activation events

### Generated Code Issues
- Check template syntax in `templates/` folder
- Verify test data format in captured sessions
- Ensure selectors are valid for target elements

## Advanced Features

### Custom Event Types
Add custom event types by modifying:
1. `chrome-extension/src/content.ts` - Add event listeners
2. `templates/` - Add handling in templates
3. `vscode-extension/src/types.ts` - Update type definitions

### Template Extensions
Create custom templates by:
1. Adding new template files to `templates/`
2. Updating `code-generator.ts` template mapping
3. Adding framework options in VS Code extension

### Integration with CI/CD
Generated tests can be integrated into CI/CD pipelines:
- Selenium: Use pytest or unittest
- Playwright: Use pytest-playwright
- Cypress: Use Cypress CLI

## Development

### Building from Source
```powershell
# Build all components
npm run build:all

# Build individual components
cd chrome-extension && npm run build
cd vscode-extension && npm run compile
```

### Running Tests
```powershell
# Run extension tests
cd vscode-extension && npm test
```

## File Structure
```
TestCaptive/
├── chrome-extension/          # Chrome extension source
│   ├── src/
│   │   ├── background.ts      # Extension background script
│   │   ├── content.ts         # Content script for DOM interaction
│   │   ├── popup.ts          # Extension popup interface
│   │   └── ...
│   └── dist/                  # Built extension files
├── vscode-extension/          # VS Code extension
│   ├── src/
│   │   ├── extension.ts       # Main extension entry point
│   │   ├── websocket-server.ts # Embedded Bridge Server
│   │   ├── webview-ui/        # Webview panels
│   │   └── ...
│   └── out/                   # Compiled extension files
├── templates/                 # Code generation templates
│   ├── selenium_template.py   # Selenium template
│   ├── playwright_template.py # Playwright template
│   └── cypress_template.ts    # Cypress template
└── test-data/                 # Sample test data and sessions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review logs in browser console and VS Code developer tools
- Create an issue in the repository with detailed error information
