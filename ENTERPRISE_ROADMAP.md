# TestCaptive Enterprise Readiness Roadmap

Audit date: March 14, 2026 | Current version: 1.2.0

## Current State

Works reliably for: simple forms, single-page interactions, demo.html-type flows.
Not yet safe for: production enterprise environments, sensitive data, complex SPAs.

---

## Phase 1: Critical Fixes (Must-Have)

### 1.1 String Escaping in Code Generation
- **Status**: ✅ DONE
- **Risk**: Code injection + syntax errors
- **Problem**: Template values (`inputValue`, `xpath`, `cssSelector`, `text`, `URL`) are interpolated raw into Python source code. A field value containing `"` or `\` breaks the generated `.py` file. A crafted value can inject arbitrary Python code.
- **Fix**: Add `escapePythonString()` to `code-generator.ts` that escapes `\`, `"`, `'`, newlines. Apply to all `{{...}}` interpolations that land inside string literals.
- **Files**: `vscode-extension/src/code-generator.ts`, `vscode-extension/templates/playwright_template.py`

### 1.2 Service Worker Persistence (Chrome Extension)
- **Status**: ✅ DONE
- **Risk**: Total data loss during recording
- **Problem**: Chrome MV3 kills service workers after ~5 minutes of inactivity. `recordedEvents[]` lives only in a JS variable — lost on termination. Also lost on extension update or crash.
- **Fix**: Persist events to `chrome.storage.local` on each `event-captured`. Load on service worker wake-up. Debounce writes (batch every 500ms).
- **Files**: `chrome-extension/src/background.ts`

### 1.3 PII/Credential Handling
- **Status**: ⏭️ SKIPPED (intranet use, test/fake data only — not needed)
- **Reason**: Extension targets intranet environments with test data. PII redaction adds unnecessary complexity.

### 1.4 Missing `import re` in Template
- **Status**: ✅ DONE
- **Problem**: `url-contains` assertion generates `re.compile()` but template doesn't import `re` — runtime crash.
- **Fix**: Add `import re` to template header.
- **Files**: `vscode-extension/templates/playwright_template.py`

---

## Phase 2: Stability & Reliability (High Priority)

### 2.1 Wait Strategies / Anti-Flakiness
- **Status**: ✅ DONE
- **Fix**: Insert `await page.wait_for_load_state("networkidle")` after navigation. Add configurable auto-wait after clicks that trigger navigation. Detect XHR/fetch in content script and annotate events with "network pending" flag.
- **Files**: `chrome-extension/src/content.ts`, `vscode-extension/templates/playwright_template.py`

### 2.2 Cross-Origin Iframe Support
- **Status**: ✅ DONE
- **Fix**: Use `chrome.runtime.sendMessage` from each frame with frame metadata (URL, index). Background script correlates by tabId. Template generates `page.frame_locator()` chains.
- **Files**: `chrome-extension/src/content.ts`, `chrome-extension/src/background.ts`, `vscode-extension/templates/playwright_template.py`

### 2.3 Shadow DOM Support
- **Status**: ✅ DONE
- **Fix**: Use `event.composedPath()` to get real target. Generate `.locator('shadow-host >> css=inner-selector')` chains. Closed shadow roots remain unsupported (browser limitation).
- **Files**: `chrome-extension/src/content.ts`, `chrome-extension/src/utils.ts`

### 2.4 `contentEditable` Rich Text Fix
- **Status**: ✅ DONE
- **Fix**: In `commitPendingFill`, check `isContentEditable` and read `textContent` instead of `value`.
- **Files**: `chrome-extension/src/content.ts`

### 2.5 `beforeunload` Fill Commit
- **Status**: ✅ DONE
- **Fix**: Add `window.addEventListener('beforeunload', commitPendingFill)`.
- **Files**: `chrome-extension/src/content.ts`

### 2.6 Selector Uniqueness Validation
- **Status**: ✅ DONE
- **Fix**: After generating a selector, run `document.querySelectorAll(selector)` and if count > 1, fall through to next priority level or append `:nth-child()`.
- **Files**: `chrome-extension/src/utils.ts`

### 2.7 Custom Dropdown / Component Detection
- **Status**: ✅ DONE
- **Fix**: Detect common ARIA patterns (`role="combobox"`, `role="listbox"`, `aria-expanded`) and emit semantic `select` events. Register known component class patterns.
- **Files**: `chrome-extension/src/content.ts`

### 2.8 Multi-Tab / Popup Window Support
- **Status**: ✅ DONE
- **Fix**: Track tab creation events (`chrome.tabs.onCreated`). Inject content script into new tabs. Emit `new-tab` / `popup` events with opener tab correlation.
- **Files**: `chrome-extension/src/background.ts`, `chrome-extension/src/types.ts`

---

## Phase 3: Enterprise Features (Medium Priority)

### 3.1 VS Code Configuration Settings
- **Status**: ✅ DONE
- **Fix**: Added `contributes.configuration` to `package.json` with settings for `selectorStrategy` (testid-first/id-first/aria-first), `outputDirectory`, `autoWait`, and `logLevel`. Code generator reads settings at generation time.
- **Files**: `vscode-extension/package.json`, `vscode-extension/src/code-generator.ts`, `vscode-extension/src/extension.ts`

### 3.2 Screenshot & Report Generation
- **Status**: ✅ DONE
- **Fix**: Updated `conftest.py` with screenshot capture on every test (pass & fail), Playwright tracing on failure, and `pytest-html` for HTML report generation.
- **Files**: `test-suite-project/conftest.py`, `test-suite-project/pytest.ini`, `test-suite-project/requirements.txt`
- **Output**: `reports/report.html`, `reports/screenshots/`, `reports/traces/`

### 3.3 Structured Logging
- **Status**: ✅ DONE
- **Fix**: Created `logger.ts` with VS Code Output Channel ("TestCaptive"), log levels (DEBUG/INFO/WARN/ERROR), configurable via `testcaptive.logLevel` setting. Replaced all `console.log/warn/error` in extension.ts, test-data-manager.ts, and code-generator.ts.
- **Files**: `vscode-extension/src/logger.ts`, `vscode-extension/src/extension.ts`, `vscode-extension/src/test-data-manager.ts`, `vscode-extension/src/code-generator.ts`

---

## Phase 4: Advanced (Nice-to-Have)

| Feature | Description |
|---------|-------------|
| Visual regression | Screenshot comparison with baselines |
| API mocking | Record/replay network requests via `page.route()` |
| Accessibility audit | Integrate axe-core assertions |
| Touch events | Mobile/tablet recording support |
| Test parallelization | `pytest-xdist` configuration |
| Data-driven tests | `@pytest.mark.parametrize` with CSV/JSON data sources |
| Soft assertions | `expect(soft=True)` support |
| i18n-aware selectors | Avoid localized text-based selectors |
| Domain whitelist/blacklist | Restrict recording to specific origins |
| Encrypted export | AES-encrypt session JSON files |

---

## Priority Matrix

```
                    HIGH IMPACT
                        |
    P1 Critical    |    P2 Stability
    (1.1-1.4)      |    (2.1-2.8)
                    |
LOW EFFORT ---------+--------- HIGH EFFORT
                    |
    P4 Advanced    |    P3 Enterprise
    (nice-to-have)  |    (3.1-3.3)
                    |
                    LOW IMPACT
```

## Quick Wins (< 1 hour each)
1. ~~1.4 Missing `import re`~~ — one line fix
2. 1.1 String escaping — add one function + apply
3. 2.4 contentEditable fix — 5-line change
4. 2.5 beforeunload handler — 3-line change
5. 3.9 Remove console.log of sensitive data

## Tracking

| ID | Item | Status | Phase |
|----|------|--------|-------|
| 1.1 | String escaping | ✅ DONE | 1 |
| 1.2 | Service worker persistence | ✅ DONE | 1 |
| 1.3 | PII handling | ⏭️ SKIPPED | 1 |
| 1.4 | Missing import re | ✅ DONE | 1 |
| 2.1 | Wait strategies | ✅ DONE | 2 |
| 2.2 | Iframe support | ✅ DONE | 2 |
| 2.3 | Shadow DOM | ✅ DONE | 2 |
| 2.4 | contentEditable | ✅ DONE | 2 |
| 2.5 | beforeunload | ✅ DONE | 2 |
| 2.6 | Selector uniqueness | ✅ DONE | 2 |
| 2.7 | Custom dropdowns | ✅ DONE | 2 |
| 2.8 | Multi-tab | ✅ DONE | 2 |
| 3.1-3.3 | Enterprise features | 🔴 TODO | 3 |
| 4.x | Advanced features | 🔴 TODO | 4 |
