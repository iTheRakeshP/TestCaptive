# Testing the Assertion Feature

## Setup

1. Reload Chrome extension at `chrome://extensions/`
2. Install VS Code extension: `code --install-extension vscode-extension/testcaptive-1.0.0.vsix`

## Test: Assertion Capture in Chrome

1. Open `demo.html` in Chrome
2. Click TestCaptive icon → **Start Recording**
3. Fill some form fields, click a button
4. **Right-click** on an element → select **"✅ TestCaptive Assertions"**
5. Try each assertion type:

| Type | Steps | Expected |
|------|-------|----------|
| Text Contains | Right-click element with text → enter partial text | Green notification ✅ |
| Text Equals | Right-click element → enter exact text | Green notification ✅ |
| Visible | Right-click visible element | Green notification ✅ |
| Not Visible | Right-click hidden element | Green notification ✅ |
| Enabled | Right-click active button | Green notification ✅ |
| Disabled | Right-click disabled field | Green notification ✅ |
| URL Contains | Right-click anywhere → enter URL fragment | Green notification ✅ |

6. **Stop** recording → session JSON downloads

## Test: Code Generation in VS Code

1. Import the session JSON into TestCaptive panel
2. Verify:
   - Purple ✅ icons appear for assertion events in event list
   - Assertion descriptions and expected values are shown
   - Generated Playwright code contains proper assertions:

```python
# Expected output examples:
await expect(page.locator('...')).to_have_text("Submit")
await expect(page.locator('...')).to_contain_text("Welcome")
await expect(page.locator('...')).to_be_visible()
await expect(page.locator('...')).not_to_be_visible()
await expect(page.locator('...')).to_be_enabled()
await expect(page.locator('...')).to_be_disabled()
await expect(page).to_have_url(re.compile("/dashboard"))
```

3. Verify no `{{` or `}}` template markers remain in output
4. Verify each assertion uses proper selector (testid preferred)

## Troubleshooting

- **Context menu not appearing**: Ensure recording is active (red icon), reload extension
- **Assertions missing in code**: Check events list shows purple ✅ icons, re-import session
- **Green notification not showing**: Check browser console for errors
