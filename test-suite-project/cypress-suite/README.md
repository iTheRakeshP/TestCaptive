# Cypress Test Suite for TestCaptive

Automated E2E testing suite powered by Cypress and TestCaptive.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Import Generated Tests

```bash
npm run import:tests
```

This script automatically:
- Reads generated tests from `../../Test-Code/Cypress.txt`
- Converts them to proper Cypress TypeScript format
- Saves to `cypress/e2e/testcaptive-generated.cy.ts`
- Cleans up template artifacts

### 3. Run Tests

```bash
# Headless mode (for CI/CD)
npm test

# Headed mode (browser visible)
npm run test:headed

# Interactive mode (Cypress Test Runner)
npm run test:open
```

## 📁 Project Structure

```
cypress-suite/
├── cypress/
│   ├── e2e/                     # Your test files
│   │   └── testcaptive-generated.cy.ts
│   ├── fixtures/                # Test data
│   │   └── test_data.json
│   └── support/                 # Commands and config
│       ├── commands.ts          # Custom Cypress commands
│       └── e2e.ts              # Global setup
├── scripts/
│   └── import-tests.js          # Test import utility
├── cypress.config.ts            # Cypress configuration
├── package.json
└── tsconfig.json
```

## 🔧 Configuration

### Cypress Config (`cypress.config.ts`)

Key settings:
- **Base URL**: Update for your application
- **Viewport**: 1280x720 (configurable)
- **Timeouts**: 10 seconds default
- **Video**: Enabled
- **Screenshots**: On failure

### Test Data (`cypress/fixtures/test_data.json`)

Customize your test inputs:

```json
{
  "input-first-name": "John",
  "input-last-name": "Doe",
  "input-email": "john.doe@example.com"
}
```

## 🎯 Features

- ✅ TypeScript support
- ✅ Custom commands (e.g., `cy.getByTestId()`)
- ✅ Automatic test data loading
- ✅ Video recording
- ✅ Screenshot on failure
- ✅ Detailed error reporting

## 📝 Adding Custom Commands

Edit `cypress/support/commands.ts`:

```typescript
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('[data-testid="username"]').type(username);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="submit"]').click();
});
```

## 🐛 Debugging

### Run in Debug Mode

```bash
npm run test:open
```

This opens the Cypress Test Runner where you can:
- See each test step
- Time travel through commands
- View network requests
- Inspect element states

### Common Issues

**Tests fail immediately**: Check if `baseUrl` in `cypress.config.ts` is correct

**Element not found**: Verify selectors in the generated test file

**Timeout errors**: Increase `defaultCommandTimeout` in config

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Cypress Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
```

### Azure DevOps Example

```yaml
steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '16.x'
  - script: npm install
  - script: npm test
```

## 📈 Reports

After running tests:
- **Videos**: `cypress/videos/`
- **Screenshots**: `cypress/screenshots/`
- **Terminal output**: Detailed pass/fail report

## 🔄 Updating Tests

When you regenerate tests with TestCaptive:

1. New tests are saved to `../../Test-Code/Cypress.txt`
2. Run `npm run import:tests`
3. Tests are automatically updated
4. Run `npm test` to verify

## 🎓 Learn More

- [Cypress Documentation](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [TypeScript Support](https://docs.cypress.io/guides/tooling/typescript-support)

---

**Ready to test!** 🚀
