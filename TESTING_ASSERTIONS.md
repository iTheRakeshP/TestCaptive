# Testing the Assertion Feature

## Quick Setup (5 minutes)

### 1. Update Chrome Extension
```bash
# Chrome extension files already updated - just reload
```

**Steps:**
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Find **TestCaptive** extension
4. Click the **refresh icon** (🔄) to reload
5. Verify it's enabled

### 2. Install Updated VSCode Extension
```bash
# Fresh VSIX built with assertion support
cd vscode-extension
code --install-extension testcaptive-1.0.0.vsix
```

**Or manually:**
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type "Extensions: Install from VSIX"
4. Select `vscode-extension/testcaptive-1.0.0.vsix`
5. Reload VS Code window

---

## Test Scenario 1: Basic Assertion Capture

### Setup
1. Open `demo.html` in Chrome (or use any web page)
2. Click TestCaptive extension icon
3. Click **🔴 Start Recording**

### Test Steps
1. **Navigate** to a page with form elements
2. **Fill** a text field (e.g., username)
3. **Click** a button
4. **Right-click** on a success message or any element
5. **Select** "✅ TestCaptive Assertions" from context menu
6. **Try each assertion type:**

   **Test 1: Text Contains**
   - Right-click element with text
   - Select "Assert Text Contains..."
   - Enter: "Success" (or partial text)
   - Should see green notification ✅

   **Test 2: Element Visible**
   - Right-click any visible element
   - Select "Assert Element Visible"
   - Should see green notification ✅

   **Test 3: URL Contains**
   - Right-click anywhere
   - Select "Assert URL Contains..."
   - Enter: part of current URL
   - Should see green notification ✅

7. **Stop** recording
8. **Download** session JSON

### Expected Results
- ✅ Green notification appears after each assertion
- ✅ Browser console shows: "✅ Assertion added: [type]"
- ✅ Session JSON contains assertion events

---

## Test Scenario 2: Code Generation with Assertions

### Setup
1. Import the session JSON from Test 1 into VS Code
2. Open TestCaptive panel

### Test Steps
1. **Check Events List**
   - Should see purple ✅ icons for assertions
   - Assertion events show description
   - Expected values displayed

2. **Generate Playwright Code**
   - Click "Playwright" tab
   - Click "Generate Code"
   - **Verify** Playwright-style assertions:
   ```python
   # Should see lines like:
   await expect(self.page.locator('#msg')).to_contain_text("Success")
   await expect(self.page.locator('#btn')).to_be_visible()
   ```

### Expected Results
- ✅ Playwright generates proper assertion code
- ✅ Assertions use correct framework syntax
- ✅ No template markers (no `{{` or `}}`)
- ✅ Clean, runnable code

---

## Test Scenario 3: All 7 Assertion Types

Create a recording with all assertion types:

### 1. Text Equals
- Right-click button → "Assert Text Equals..." → Enter "Submit"
- **Expected Code (Playwright):** `await expect(locator).to_have_text("Submit")`

### 2. Text Contains
- Right-click message → "Assert Text Contains..." → Enter "Welcome"
- **Expected Code (Playwright):** `await expect(locator).to_contain_text("Welcome")`

### 3. Visible
- Right-click visible element → "Assert Element Visible"
- **Expected Code (Playwright):** `await expect(locator).to_be_visible()`

### 4. Not Visible
- Right-click hidden element → "Assert Element Not Visible"
- **Expected Code (Playwright):** `await expect(locator).not_to_be_visible()`

### 5. Enabled
- Right-click active button → "Assert Element Enabled"
- **Expected Code (Playwright):** `await expect(locator).to_be_enabled()`

### 6. Disabled
- Right-click disabled field → "Assert Element Disabled"
- **Expected Code (Playwright):** `await expect(locator).to_be_disabled()`

### 7. URL Contains
- Right-click anywhere → "Assert URL Contains..." → Enter "/dashboard"
- **Expected Code (Playwright):** `await expect(page).to_have_url(re.compile("/dashboard"))`

---

## Troubleshooting

### Context Menu Not Appearing?
**Fix:**
1. Ensure recording is active (red icon in Chrome)
2. Reload Chrome extension (`chrome://extensions/`)
3. Check browser console for errors (F12)

### Assertions Not in Generated Code?
**Fix:**
1. Check VS Code extension is latest version
2. Verify assertions show in Events List (purple ✅)
3. Check template files have assertion blocks
4. Re-import session JSON

### Green Notification Not Showing?
**Fix:**
1. Check browser console: `console.log('✅ Assertion added')`
2. Verify `showAssertionFeedback()` function in content.js
3. Try different assertion type

---

## Demo Script for Stakeholders

**"Let me show you the assertion feature..."**

1. **Start Recording**
   - "I'll record a simple login flow"

2. **Perform Actions**
   - Fill username, password
   - Click login button

3. **Add Assertions** (THIS IS THE KEY DEMO!)
   - "Now, instead of just recording actions..."
   - Right-click welcome message
   - "I can validate expected results directly"
   - Select "Assert Text Contains"
   - Enter "Welcome"
   - **Point out green notification** 👈 IMPORTANT!

4. **Add More Assertions**
   - Right-click logout button → "Assert Element Visible"
   - Right-click URL → "Assert URL Contains" → "/dashboard"

5. **Generate Code**
   - Import in VS Code
   - Show purple ✅ icons in event list
   - Generate Playwright code
   - **Point out assertion lines** 👈 IMPORTANT!
   - "These assertions run automatically in CI/CD"
   - "No manual validation needed"

6. **Compare to Competition**
   - "Other tools require manual assertion coding"
   - "TestCaptive captures them during recording"
   - "Saves 2-4 hours per test"

---

## Known Issues / Limitations

### Current Version (1.1.0)
- ✅ All 7 assertion types working
- ✅ Playwright framework supported
- ✅ Visual feedback implemented
- ⚠️ No bulk assertion import yet
- ⚠️ No AI suggestion yet (roadmap item)

### Browser Compatibility
- ✅ Chrome/Edge (Manifest V3)
- 📋 Firefox (future - needs Manifest V2 version)
- 📋 Safari (future - needs Safari extension)

---

## Success Criteria

### ✅ Feature is working if:
1. Context menu appears with 7 assertion types
2. Green notification shows after adding assertion
3. Assertions appear in VS Code with ✅ icon
4. Playwright generates proper assertion code
5. No template markers in generated code
6. Code is clean and runnable

### 🎯 Demo is successful if:
1. Stakeholder sees value immediately
2. "Wow" moment when assertions generate automatically
3. Clear understanding of time savings
4. Asks about implementation timeline
5. Wants to try it themselves

---

## Next Steps After Testing

1. **Report Issues:** Create GitHub issues for any bugs
2. **Gather Feedback:** What assertion types are missing?
3. **Performance Test:** Record large sessions (100+ events)
4. **Real Workflow:** Use on actual project
5. **Team Demo:** Show to QA team
6. **Management Pitch:** Use for enterprise pitch

---

## Quick Reference

### Context Menu Path
```
Right-click → ✅ TestCaptive Assertions → [Select Type]
```

### Assertion Event in JSON
```json
{
  "type": "assertion",
  "timestamp": "2025-12-10T...",
  "sessionId": "session_...",
  "assertion": {
    "type": "text-contains",
    "description": "Assert #msg text contains 'Success'",
    "expectedValue": "Success",
    "element": { "id": "msg", "tag": "div", ... }
  }
}
```

### Generated Code Pattern
```python
# Playwright
await expect(locator).to_be_visible()
```

---

**Happy Testing!** 🚀
