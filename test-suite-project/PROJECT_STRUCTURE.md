# 📁 Test Suite Project Structure

Complete directory structure of the TestCaptive Test Suite Project.

```
test-suite-project/
│
├── 📄 README.md                          # Main documentation
├── 📄 QUICK_START.md                     # Quick start guide
├── 📄 package.json                       # Project metadata
├── 📄 .gitignore                         # Git ignore rules
├── 📄 import-tests.bat                   # Windows import script
├── 📄 import-tests.sh                    # Linux/Mac import script
│
├── 📂 shared/                            # Shared utilities
│   └── 📄 import-all-tests.py           # Universal import script
│
└── 📂 playwright-suite/                  # Playwright Test Suite
    ├── 📄 README.md                     # Playwright documentation
    ├── 📄 package.json                  # NPM reference
    ├── 📄 requirements.txt              # Python dependencies
    ├── 📄 pytest.ini                    # Pytest configuration
    ├── 📄 conftest.py                   # Pytest fixtures
    ├── 📄 test_data.json               # Test data
    │
    ├── 📂 tests/                        # Test files (generated)
    │   └── 📄 test_generated.py
    │
    └── 📂 scripts/
        └── 📄 import_tests.py           # Test import utility
```

---

## 🔄 Data Flow

```
TestCaptive Extensions
         ↓
    Test-Code/
    └── Playwright.txt
         ↓
   import scripts
         ↓
Test Suite Project
└── playwright-suite/tests/
         ↓
    Test Execution
         ↓
   Results & Reports
```

---

## 📊 File Count Summary

- **Total Files**: ~15 files
- **Configuration Files**: 4
- **Test Files**: 1 (after import)
- **Documentation**: 7
- **Scripts**: 3
- **Support Files**: 1

---

## 🎯 Key Files by Purpose

### Configuration
- `pytest.ini` - Pytest settings
- `conftest.py` - Pytest fixtures

### Test Data
- `test_data.json` - Input values for tests

### Import Scripts
- `import_tests.py` - Playwright importer
- `import-all-tests.py` - Universal importer

### Documentation
- `README.md` - Main docs
- `QUICK_START.md` - Quick reference

---

## 🚀 Generated After Import

After running import scripts:

```
playwright-suite/
└── tests/
    └── test_generated.py            ✨ Generated
```

---

## 📦 Dependencies

### Playwright Suite
- Python packages: `pytest`, `pytest-asyncio`, `playwright`

---

## 🔧 Auto-Generated During Tests

### Playwright
```
playwright-suite/
└── .pytest_cache/   # Test cache
```

---

This structure is designed for:
- ✅ Easy navigation
- ✅ Clear separation of concerns
- ✅ Simple maintenance
- ✅ Scalability
