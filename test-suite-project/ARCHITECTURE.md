# 🏗️ Test Suite Project Architecture

Visual representation of the TestCaptive Test Suite Project architecture and data flow.

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTCAPTIVE ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐              ┌─────────────────┐             │
│  │   Chrome     │              │   VS Code       │             │
│  │  Extension   │─────────────>│   Extension     │             │
│  │              │              │                 │             │
│  │ (Captures)   │              │ (Generates)     │             │
│  └──────────────┘              └────────┬────────┘             │
│                                          │                       │
│                                          ▼                       │
│                              ┌─────────────────────┐            │
│                              │   Test-Code/        │            │
│                              ├─────────────────────┤            │
│                              │  Cypress.txt        │            │
│                              │  Playwright.txt     │            │
│                              │  Selenium.txt       │            │
│                              └──────────┬──────────┘            │
│                                          │                       │
│                                          ▼                       │
│                          ┌───────────────────────────┐          │
│                          │   TEST SUITE PROJECT      │          │
│                          │   (This Project)          │          │
│                          └───────────┬───────────────┘          │
│                                      │                           │
│                    ┌─────────────────┼─────────────────┐        │
│                    │                 │                 │        │
│                    ▼                 ▼                 ▼        │
│          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│          │   Cypress    │  │  Playwright  │  │   Selenium   │ │
│          │    Suite     │  │    Suite     │  │    Suite     │ │
│          └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│                 │                 │                 │          │
│                 ▼                 ▼                 ▼          │
│          ┌──────────────────────────────────────────────────┐ │
│          │           TEST EXECUTION RESULTS                 │ │
│          └──────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
USER INTERACTION
       │
       ├─> Perform actions on website
       │
       ▼
┌────────────────┐
│ Chrome Ext     │ ─> Captures DOM events, selectors, user actions
└────────┬───────┘
         │
         ├─> Sends session data
         │
         ▼
┌────────────────┐
│ VS Code Ext    │ ─> Generates test code (3 formats)
└────────┬───────┘
         │
         ├─> Saves to Test-Code/
         │
         ▼
┌─────────────────────────┐
│  Test-Code/             │
│  ├── Cypress.txt        │
│  ├── Playwright.txt     │
│  └── Selenium.txt       │
└──────────┬──────────────┘
           │
           ├─> User runs import script
           │
           ▼
┌─────────────────────────────────────┐
│ Import Scripts                      │
│ ├─> import-tests.js  (Cypress)     │
│ ├─> import_tests.py (Playwright)   │
│ └─> import_tests.py (Selenium)     │
└──────────┬──────────────────────────┘
           │
           ├─> Converts & cleans code
           │
           ▼
┌─────────────────────────────────────┐
│ Test Suites                         │
│ ├─> cypress/e2e/*.cy.ts            │
│ ├─> playwright/tests/*.py          │
│ └─> selenium/tests/*.py            │
└──────────┬──────────────────────────┘
           │
           ├─> User runs tests
           │
           ▼
┌─────────────────────────────────────┐
│ Test Execution                      │
│ ├─> Cypress Test Runner            │
│ ├─> Pytest (Playwright)            │
│ └─> Pytest (Selenium)              │
└──────────┬──────────────────────────┘
           │
           ├─> Generates artifacts
           │
           ▼
┌─────────────────────────────────────┐
│ Results & Reports                   │
│ ├─> Screenshots                     │
│ ├─> Videos (Cypress)                │
│ ├─> Terminal output                 │
│ └─> Test reports                    │
└─────────────────────────────────────┘
```

---

## 🏛️ Project Structure Architecture

```
test-suite-project/
│
├─── 📚 DOCUMENTATION LAYER
│    ├── INDEX.md              ─────> Entry point
│    ├── README.md             ─────> Complete docs
│    ├── QUICK_START.md        ─────> Fast setup
│    ├── PROJECT_STRUCTURE.md  ─────> Structure guide
│    └── SETUP_COMPLETE.md     ─────> Summary
│
├─── 🔧 CONFIGURATION LAYER
│    ├── package.json          ─────> Project metadata
│    └── .gitignore            ─────> VCS rules
│
├─── 🔄 AUTOMATION LAYER
│    ├── import-tests.bat      ─────> Windows bulk import
│    ├── import-tests.sh       ─────> Unix bulk import
│    └── shared/
│         └── import-all-tests.py ──> Universal importer
│
└─── 🧪 TEST SUITE LAYER
     │
     ├─── 🌲 Cypress Suite
     │    ├── Config     ─────> cypress.config.ts, tsconfig.json
     │    ├── Tests      ─────> cypress/e2e/*.cy.ts
     │    ├── Fixtures   ─────> cypress/fixtures/test_data.json
     │    ├── Support    ─────> cypress/support/*.ts
     │    └── Scripts    ─────> scripts/import-tests.js
     │
     ├─── 🎭 Playwright Suite
     │    ├── Config     ─────> pytest.ini, conftest.py
     │    ├── Tests      ─────> tests/*.py
     │    ├── Data       ─────> test_data.json
     │    └── Scripts    ─────> scripts/import_tests.py
     │
     └─── 🔧 Selenium Suite
          ├── Config     ─────> pytest.ini, conftest.py
          ├── Tests      ─────> tests/*.py
          ├── Data       ─────> test_data.json
          └── Scripts    ─────> scripts/import_tests.py
```

---

## 🔀 Import Script Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPORT PROCESS                            │
└─────────────────────────────────────────────────────────────┘

1. READ SOURCE
   │
   ├─> Locate Test-Code/*.txt
   ├─> Read file content
   └─> Validate file exists
   │
   ▼

2. CLEAN & TRANSFORM
   │
   ├─> Remove handlebars templates  {{...}}
   ├─> Fix duplicate declarations
   ├─> Remove invalid assertions
   ├─> Adjust indentation
   ├─> Convert to framework syntax
   └─> Add proper imports
   │
   ▼

3. GENERATE TEST FILE
   │
   ├─> Create target directory
   ├─> Write transformed code
   └─> Set proper file extension
   │
   ▼

4. VERIFY
   │
   ├─> Check file created
   ├─> Validate syntax
   └─> Report success/failure
   │
   ▼

5. READY TO RUN ✅
```

---

## 🎯 Test Execution Flow

### Cypress
```
npm test
   │
   ├─> Load cypress.config.ts
   │
   ├─> Initialize Cypress
   │
   ├─> Load fixtures (test_data.json)
   │
   ├─> Execute tests in cypress/e2e/
   │   │
   │   ├─> Start browser
   │   ├─> Run test steps
   │   ├─> Capture video
   │   └─> Screenshot on fail
   │
   └─> Generate report
```

### Playwright/Selenium
```
pytest tests/ -v
   │
   ├─> Load pytest.ini config
   │
   ├─> Execute conftest.py (fixtures)
   │   │
   │   ├─> Create browser/driver
   │   └─> Load test_data.json
   │
   ├─> Discover test files
   │
   ├─> Run each test function
   │   │
   │   ├─> Setup (browser/page)
   │   ├─> Execute test steps
   │   ├─> Assertions
   │   └─> Teardown
   │
   └─> Generate report
```

---

## 🌐 Multi-Framework Architecture

```
                    ┌──────────────────┐
                    │  Test-Code/      │
                    │  Source Files    │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Import     │ │   Import     │ │   Import     │
    │   Script     │ │   Script     │ │   Script     │
    │  (Cypress)   │ │ (Playwright) │ │  (Selenium)  │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ TypeScript   │ │   Python     │ │   Python     │
    │   Tests      │ │   Tests      │ │   Tests      │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Cypress    │ │  Playwright  │ │   Selenium   │
    │   Runner     │ │  + Pytest    │ │  + Pytest    │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           └────────────────┼────────────────┘
                            ▼
                    ┌──────────────────┐
                    │   Test Results   │
                    │   & Reports      │
                    └──────────────────┘
```

---

## 🔐 Key Design Principles

### 1. **Separation of Concerns**
```
├── Each framework in separate folder
├── Shared utilities in common folder
└── Independent configurations
```

### 2. **DRY (Don't Repeat Yourself)**
```
├── Centralized test data
├── Reusable import scripts
└── Common patterns across suites
```

### 3. **Convention over Configuration**
```
├── Standard directory structure
├── Predictable file naming
└── Framework best practices
```

### 4. **Extensibility**
```
├── Easy to add new frameworks
├── Simple to customize
└── Plugin-ready architecture
```

---

## 📦 Dependency Graph

```
Cypress Suite Dependencies:
    cypress@13.6.2
    └── @cypress/webpack-preprocessor
    typescript@5.3.3
    @types/node@20.10.6

Playwright Suite Dependencies:
    pytest@7.4.3
    ├── pytest-asyncio@0.21.1
    └── playwright@1.40.0
        └── Browser binaries (auto-downloaded)

Selenium Suite Dependencies:
    pytest@7.4.3
    selenium@4.16.0
    └── webdriver-manager@4.0.1
        └── ChromeDriver (auto-downloaded)
```

---

## 🚀 CI/CD Integration Architecture

```
┌──────────────────────────────────────────────┐
│           CI/CD Pipeline                      │
├──────────────────────────────────────────────┤
│                                               │
│  1. Code Commit                               │
│     │                                         │
│     ▼                                         │
│  2. Trigger Build                             │
│     │                                         │
│     ▼                                         │
│  3. Install Dependencies                      │
│     ├─> npm install (Cypress)                │
│     ├─> pip install (Playwright)             │
│     └─> pip install (Selenium)               │
│     │                                         │
│     ▼                                         │
│  4. Import Tests                              │
│     └─> Run import scripts                   │
│     │                                         │
│     ▼                                         │
│  5. Execute Tests                             │
│     ├─> Cypress (headless)                   │
│     ├─> Playwright (headless)                │
│     └─> Selenium (headless)                  │
│     │                                         │
│     ▼                                         │
│  6. Collect Artifacts                         │
│     ├─> Screenshots                           │
│     ├─> Videos                                │
│     └─> Test reports                          │
│     │                                         │
│     ▼                                         │
│  7. Publish Results                           │
│     └─> GitHub Actions / Azure / Jenkins     │
│                                               │
└──────────────────────────────────────────────┘
```

---

## 🎯 Component Interaction

```
User Actions ──────────> Chrome Extension
                               │
                               ├─> Captures Events
                               │
                               ▼
                        Session Storage
                               │
                               ├─> Export Data
                               │
                               ▼
                        VS Code Extension
                               │
                               ├─> Generate Code
                               │   ├─> Cypress
                               │   ├─> Playwright
                               │   └─> Selenium
                               │
                               ▼
                          Test-Code/
                               │
                               ├─> Import Scripts Read
                               │
                               ▼
                        Test Suites
                               │
                               ├─> Execute
                               │
                               ▼
                          Results
```

---

## 📊 Scalability Model

```
Single Test
    │
    ├─> Multiple Test Cases
    │       │
    │       ├─> Test Suite
    │       │       │
    │       │       ├─> Multiple Suites
    │       │       │       │
    │       │       │       ├─> Framework Level
    │       │       │       │       │
    │       │       │       │       ├─> Multi-Framework
    │       │       │       │       │       │
    │       │       │       │       │       └─> Enterprise Scale
```

---

This architecture enables:
- ✅ Independent framework operation
- ✅ Parallel test execution
- ✅ Easy maintenance and updates
- ✅ Flexible customization
- ✅ Scalable growth

---

**Architecture Status**: ✅ **PRODUCTION READY**
