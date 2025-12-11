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
├── 📂 cypress-suite/                     # Cypress Test Suite
│   ├── 📄 README.md                     # Cypress documentation
│   ├── 📄 package.json                  # NPM dependencies
│   ├── 📄 cypress.config.ts             # Cypress configuration
│   ├── 📄 tsconfig.json                 # TypeScript configuration
│   │
│   ├── 📂 cypress/
│   │   ├── 📂 e2e/                      # Test files (generated)
│   │   │   └── 📄 testcaptive-generated.cy.ts
│   │   │
│   │   ├── 📂 fixtures/                 # Test data
│   │   │   └── 📄 test_data.json
│   │   │
│   │   ├── 📂 support/                  # Support files
│   │   │   ├── 📄 commands.ts          # Custom commands
│   │   │   └── 📄 e2e.ts               # Global setup
│   │   │
│   │   ├── 📂 screenshots/              # Test screenshots (auto)
│   │   └── 📂 videos/                   # Test videos (auto)
│   │
│   └── 📂 scripts/
│       └── 📄 import-tests.js           # Test import utility
│
├── 📂 playwright-suite/                  # Playwright Test Suite
│   ├── 📄 README.md                     # Playwright documentation
│   ├── 📄 package.json                  # NPM reference
│   ├── 📄 requirements.txt              # Python dependencies
│   ├── 📄 pytest.ini                    # Pytest configuration
│   ├── 📄 conftest.py                   # Pytest fixtures
│   ├── 📄 test_data.json               # Test data
│   │
│   ├── 📂 tests/                        # Test files (generated)
│   │   └── 📄 test_generated.py
│   │
│   └── 📂 scripts/
│       └── 📄 import_tests.py           # Test import utility
│
└── 📂 selenium-suite/                    # Selenium Test Suite
    ├── 📄 README.md                     # Selenium documentation
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
    ├── Cypress.txt
    ├── Playwright.txt
    └── Selenium.txt
         ↓
   import scripts
         ↓
Test Suite Project
├── cypress-suite/cypress/e2e/
├── playwright-suite/tests/
└── selenium-suite/tests/
         ↓
    Test Execution
         ↓
   Results & Reports
```

---

## 📊 File Count Summary

- **Total Files**: ~30 files
- **Configuration Files**: 12
- **Test Files**: 3 (after import)
- **Documentation**: 5
- **Scripts**: 6
- **Support Files**: 4

---

## 🎯 Key Files by Purpose

### Configuration
- `cypress.config.ts` - Cypress settings
- `pytest.ini` - Pytest settings (Playwright & Selenium)
- `conftest.py` - Pytest fixtures
- `tsconfig.json` - TypeScript settings

### Test Data
- `test_data.json` - Input values for tests (3 copies)

### Import Scripts
- `import-tests.js` - Cypress importer
- `import_tests.py` - Python importers (2x)
- `import-all-tests.py` - Universal importer

### Documentation
- `README.md` - Main docs (4 total)
- `QUICK_START.md` - Quick reference

---

## 🚀 Generated After Import

After running import scripts:

```
cypress-suite/
└── cypress/e2e/
    └── testcaptive-generated.cy.ts  ✨ Generated

playwright-suite/
└── tests/
    └── test_generated.py            ✨ Generated

selenium-suite/
└── tests/
    └── test_generated.py            ✨ Generated
```

---

## 📦 Dependencies

### Cypress Suite
- Node.js packages: `cypress`, `typescript`, `@types/node`

### Playwright Suite
- Python packages: `pytest`, `pytest-asyncio`, `playwright`

### Selenium Suite
- Python packages: `pytest`, `selenium`, `webdriver-manager`

---

## 🔧 Auto-Generated During Tests

### Cypress
```
cypress-suite/cypress/
├── screenshots/     # On test failure
└── videos/          # Every test run
```

### Playwright
```
playwright-suite/
└── .pytest_cache/   # Test cache
```

### Selenium
```
selenium-suite/
└── .pytest_cache/   # Test cache
```

---

This structure is designed for:
- ✅ Easy navigation
- ✅ Clear separation of concerns
- ✅ Framework independence
- ✅ Simple maintenance
- ✅ Scalability
