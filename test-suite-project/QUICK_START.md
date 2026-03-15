# 🚀 Quick Start Guide - TestCaptive Test Suite Project

Get up and running in 5 minutes!

## ⚡ Fastest Path to Running Tests

### Step 1: Setup Playwright

```bash
cd test-suite-project/playwright-suite
pip install -r requirements.txt
playwright install

# Option 1: Manual Copy (Recommended if code is clean)
# Copy Test-Code/Playwright.txt to tests/test_generated.py

# Option 2: Auto-Import (Cleans & converts)
python scripts/import_tests.py

pytest tests/ -v --headed
```

### Step 2: You're Done! 🎉

Tests should now be running with the data from your Test-Code folder.

---

## 📋 What Just Happened?

1. ✅ Installed framework dependencies
2. ✅ Imported your generated tests from `Test-Code/` folder
3. ✅ Converted tests to proper format
4. ✅ Loaded test data
5. ✅ Executed tests

---

## 🔄 Regular Workflow

### When You Generate New Tests:

1. **Capture interactions** using Chrome extension
2. **Generate code** using VS Code extension
3. **Add tests to suite** (choose one method):
   
   **Method A: Manual Copy (Simple & Direct)**
   ```bash
   # Playwright
   copy Test-Code\Playwright.txt playwright-suite\tests\test_generated.py
   ```
   
   **Method B: Auto-Import (Cleans template artifacts)**
   ```bash
   cd playwright-suite && python scripts/import_tests.py
   ```

4. **Run tests**:
   ```bash
   pytest tests/ -v
   ```

---

## 🎯 Common Commands

### Playwright
```bash
pytest tests/ -v              # Run headless
pytest tests/ -v --headed     # Run with browser
pytest tests/ -v -s           # With debug output
```

---

## ⚙️ Customization

### Update Test Data

Edit `test_data.json` in your framework's folder:

```json
{
  "input-first-name": "Your Name",
  "input-last-name": "Your Last Name",
  "input-email": "your.email@example.com"
}
```

### Change Browser

**Playwright**: Modify `conftest.py` fixture

---

## 🆘 Troubleshooting

### Tests Won't Import

- ✅ Check that `Test-Code/` folder exists
- ✅ Verify `Playwright.txt` exists
- ✅ Run import script from correct directory

### Tests Fail to Run

**Playwright:**
- Run `playwright install`
- Ensure Python 3.8+

### Browser Doesn't Open

**Playwright:** Add `--headed` flag

---

## 📚 Next Steps

1. **Read the full README** - `test-suite-project/README.md`
2. **Framework-specific docs** - Each suite has its own README
3. **Customize configurations** - Adjust to your needs
4. **Add CI/CD** - Examples included in docs

---

## 🎓 Tips

- Start with headed mode to see what's happening
- Use `--headed` flag for visual debugging
- Customize test data for your use cases
- Run import after each code generation
- Check the playwright-suite README for advanced features

---

**Happy Testing! 🚀**

Need help? Check the main README or framework-specific documentation.
