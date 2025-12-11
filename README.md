# TestCaptive - Professional UI Behavior Recording Tool

![TestCaptive Logo](https://img.shields.io/badge/TestCaptive-v1.0.0-blue) ![Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

**TestCaptive** is a comprehensive UI behavior recording tool that captures user interactions in web browsers and automatically generates test automation scripts for Selenium, Playwright, and Cypress frameworks.

## 🚀 **Features**

### **Core Functionality**
- ✅ **Real-time Event Capture** - Records clicks, inputs, form submissions, and navigation
- ✅ **Smart Assertion Capture** - Right-click context menu to add 7 types of assertions during recording
- ✅ **Multi-Framework Support** - Generates code for Selenium (Python), Playwright (Python), and Cypress (TypeScript)
- ✅ **Professional VS Code Integration** - Clean, modern extension UI with split-pane layout
- ✅ **Automatic Test Data Extraction** - Captures form data and variables for parameterized tests
- ✅ **Cross-Browser Compatibility** - Works with Chrome, Edge, and other Chromium-based browsers
- ✅ **Session Management** - Save, load, and replay recording sessions
- ✅ **Code Export & Copy** - Export generated code or copy to clipboard
- ✅ **Data Export** - Export captured test data as JSON
- ✅ **Offline Mode** - Fully independent Chrome and VS Code extensions (No WebSocket bridge required)

### **Professional UI**
- 🎯 **Left Panel**: Setup & Recording Controls
- 📊 **Right Panel**: Three organized sections:
  1. **Captured Events** - Real-time event display with color-coded icons (includes assertions with ✅)
  2. **Extracted Test Data** - Key-value pairs with export functionality

### **Smart Assertions** ✅
Right-click on any element during recording to add validations:
- **Text Validation**: Assert text equals/contains expected value
- **Visibility Checks**: Assert element visible/not visible
- **State Validation**: Assert element enabled/disabled
- **Navigation**: Assert URL contains expected path
- **All 7 assertion types** generate proper framework-specific code

## 📁 **Project Structure**

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
├── 📄 package.json             # Root project configuration
└── 📄 README.md                # This file
```

## 🛠️ **Components Overview**

### 🌐 **Chrome Extension** (`chrome-extension/`)
- **Purpose**: Records user interactions in real-time
- **Features**: DOM event capture, CSS selector generation, Session Export
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
3. Click "Load unpacked" and select the `chrome-extension` folder

### 5. Install VS Code Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click "..." menu > "Install from VSIX..."
4. Package the vscode-extension folder or install in development mode

## Usage

### Step 1: Record Session (Chrome)
1. Open the TestCaptive Chrome Extension popup.
2. Click **Start Recording**.
3. Navigate to your application and perform the actions you want to record.
4. Click **Stop Recording**.
5. The extension will automatically download a `.json` session file (e.g., `testcaptive-session_12345.json`).

### Step 2: Generate Code (VS Code)
1. Open VS Code and launch the **TestCaptive** extension.
2. Drag and drop the downloaded `.json` file into the **Import Recording** zone in the left panel.
3. The events will be loaded into the view.
4. Select your desired framework (Selenium, Playwright, Cypress).
5. The test code will be automatically generated in the right panel.
6. Click **Copy** or **Export** to save the code.

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

### **Usage Workflow**

#### **🎬 Recording a Session**
1. **Start Recording**
   - Click the TestCaptive icon in Chrome toolbar
   - Click **🔴 Start Recording**

2. **Interact with Web Application**
   - Navigate to your target web application
   - Perform user actions: fill forms, click buttons, navigate pages
   - **Add Assertions**: Right-click any element → Select "✅ TestCaptive Assertions"
     - Choose assertion type (text equals, visible, enabled, etc.)
     - Enter expected values when prompted
   - Watch the event count increase in the popup

3. **Stop & Save**
   - Click **⏹️ Stop Recording** when complete
   - A JSON file containing your session will be downloaded automatically

#### **⚡ Code Generation**
1. **Import Session**
   - Open TestCaptive in VS Code
   - Drag & Drop the JSON file into the import area

2. **Select Framework**
   - Choose from: Selenium, Playwright, or Cypress tabs

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
    
    # Assertion: Assert success message is visible
    element = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.ID, "success-msg"))
    )
    assert element.is_displayed(), "Element should be visible"
    
    # Assertion: Assert success message contains "Success"
    assert "Success" in element.text, f"Expected text to contain 'Success', got '{element.text}'"
    
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

## Configuration

### Template Customization
Templates are located in the `templates/` folder and use Handlebars-style syntax:
- `{{events}}` - Loop through captured events
- `{{testData}}` - Access test data variables
- `{{applicationUrl}}` - Application URL
- `{{userRole}}` - User role for the session

### VS Code Extension Settings
Configure in VS Code settings:
- `testcaptive.defaultFramework` - Default testing framework

## Troubleshooting

### Chrome Extension Not Recording
- Check if extension is loaded and enabled
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
