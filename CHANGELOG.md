# TestCaptive Changelog

## [1.3.0] - Evidence Capture, Allure Reporting & Interactive Review

### Chrome Extension — Evidence & Selector Confidence
- **Evidence event capture** alongside user actions:
  - `network` — fetch/XHR with method, URL, status, duration, and a 500-char body preview for JSON/text responses (with sane filters to avoid binary noise)
  - `console` — `console.warn` and `console.error` only (info/debug skipped to reduce noise)
  - `page-error` — uncaught `window.error` and `unhandledrejection`
  - `storage-snapshot` — localStorage / sessionStorage / cookies snapshot at session start
  - `wait-hint` — synthetic events injected when the gap before the next user action is ≥ 800ms (reason: `network-idle` if requests in flight, else `time-gap`)
- **Selector confidence + tier on every captured element** — every `ElementInfo` now carries `selectorTier` (`testid` / `aria-label` / `id` / `name` / `role-text` / `class` / `xpath` / `nth-child`) and a 0–100 `selectorConfidence` score (with a 20-point penalty when an `nth-of-type` refinement was needed). Tiers are scored: `testid=100`, `aria-label=90`, `id=80`, `name=70`, `role-text=55`, `class=50`, `xpath=30`, `nth-child=10`.

### VS Code Extension — Interactive Review Panel
- **▶ Run Test button** — runs the currently displayed generated test directly via the test-suite project's venv (`.venv/Scripts/python.exe` on Windows, system `python` fallback). Output streams to a dedicated **TestCaptive: Test Run** Output channel.
- **Per-step enable/disable** — every event row now has a checkbox. Disabled steps are tagged `__tcDisabled` and skipped by the generator; the regenerated code updates live in the editor pane.
- **Selector confidence pill** — each action shows a colored badge (green ≥ 80, orange ≥ 50, red < 50) with the tier on hover.
- **Evidence rendering** — new icons and detail rows for `network` 🌐, `console` 📝, `page-error` 💥, `wait-hint` ⏳, and `storage-snapshot` 💾. Evidence rows are tagged with a purple `EVIDENCE` pill so reviewers know they are not generated as Playwright code.
- **Auto-wait promotion** — when `autoWait` is enabled and a `wait-hint` is ≥ 1500ms with reason `network-idle` or `time-gap`, the generator emits a real `await page.wait_for_load_state("networkidle", timeout=...)` wrapped in its own Allure step.

### Code Generator — Allure Step Wrapping
- Every generated user action is now wrapped in `async with allure.step("N. <action description>"):` for clean Allure reports.
- Evidence-only event types (`network`, `console`, `page-error`, `storage-snapshot`) are filtered out of generated code — they are surfaced as Allure attachments at runtime instead.
- Disabled steps (via the review panel checkbox) are skipped via a `__tcDisabled === true` filter.
- Fixed leading-whitespace bug in the `{{#events}}` template replacement that previously double-indented the first generated step.
- New `RecordedEventType` values added: `submit`, `new-tab`, `network`, `console`, `page-error`, `wait-hint`, `storage-snapshot`.

### Test Suite — Allure Reporting
- **`allure-pytest>=2.13.5`** added to `requirements.txt`.
- **`pytest.ini`** updated: `addopts` now writes Allure raw results to `reports/allure-results` (`--alluredir=reports/allure-results --clean-alluredir`) alongside the existing pytest-html report.
- **`conftest.py`** enhancements:
  - `capture_step()` writes the screenshot file *and* attaches it to the active Allure step.
  - The `page` fixture now collects `console_log`, `network_log`, and `page_errors` lists via Playwright's `page.on("console" / "pageerror" / "response")` events.
  - On every test (pass or fail) the final screenshot, console log, network log, and page-errors log are attached to the Allure report. On failure the Playwright trace ZIP is also attached.
- **`generate-report.bat`** new helper script — verifies the Allure CLI is on PATH (with install hints for scoop/npm/manual), runs `allure generate reports/allure-results -o reports/allure-html --clean`, and opens the resulting `index.html`.
- **`vscode-extension/templates/playwright_template.py`** — adds `import allure` plus `@allure.feature("Recorded UI Flow")` and `@allure.severity(allure.severity_level.NORMAL)` decorators.

### Files Added
- `test-suite-project/generate-report.bat`
- `CLEANUP_CANDIDATES.md` (review-only — nothing was deleted)

---

## [1.2.0] - March 14, 2026 - Smart Event Capture & Code Generation

### Chrome Extension — Smart Capture
- **Action-based recording model**: Records high-level actions (fill, check, select) instead of raw DOM events
- **Fill coalescing**: Debounced with 1500ms delay; only final value per field is recorded
- **Select capture**: Records `select` event with `inputValue`; suppresses redundant click on `<select>` elements
- **Checkbox/Radio**: Records `check` event; suppresses preceding click event
- **Click suppression**: Clicks on text inputs and `<select>` elements are suppressed (covered by fill/select)
- **Scroll capture**: Records scroll position with Y offset

### VS Code Extension — Smart Code Generation
- **Nesting-aware template engine**: Correctly processes nested `{{#if}}` conditionals (event type → element selector → assertion type → assertion element)
- **Smart coalescence**: Merges consecutive fills to same field, suppresses clicks before fill/check/select, filters Tab keydown
- **Proper selector resolution**: Single locator per action using 6-level priority (testid → ariaLabel → id → name → xpath → CSS)
- **Assertion code generation**: Selects correct assertion type branch and element selector — outputs clean, single-line assertions
- **Test data extraction**: Handles `fill`, `select`, `input`, `change` events with `event.type` fallback
- **Line ending normalization**: Handles Windows CRLF templates correctly
- **Blank line cleanup**: Strips trailing whitespace and collapses excessive blank lines

### Bug Fixes
- Fixed duplicate locator output (xpath + cssSelector both rendering) — `selectElementBranch` was overwriting `endContent` when `{{else}}` already set it
- Fixed all assertion type branches rendering instead of just the matching one — `simplePropertyMatches` regex was too broad, matching complex expressions
- Fixed test data JSON missing fill/select values — added `fill` and `select` event type recognition
- Fixed multiple fills per field — increased commit delay and added consecutive fill merge in coalescence
- Fixed empty `testcode.py` — added `type` field fallback in test data manager
- Fixed scroll missing Y value — extracts from `scrollPosition.y`
- Fixed checkbox showing both click and check — added click-before-check suppression

---

## [1.1.0] - December 10, 2025 - Smart Assertion Capture

### 🎯 Major Features Added

#### Smart Assertion Capture System
**Game-changing feature that eliminates manual validation overhead**

**Chrome Extension Updates:**
- ✅ Right-click context menu with 7 assertion types
- ✅ Visual feedback when assertions are added (green notification)
- ✅ Element capture on right-click
- ✅ Smart prompts for text-based assertions (pre-filled with actual values)
- ✅ Assertion events stored in session JSON

**Available Assertion Types:**
1. **Text Equals** - Exact text match validation
2. **Text Contains** - Partial text match validation
3. **Visible** - Element visibility check
4. **Not Visible** - Element should be hidden
5. **Enabled** - Interactive state validation
6. **Disabled** - Locked state validation
7. **URL Contains** - Navigation verification

**VSCode Extension Updates:**
- ✅ Enhanced type definitions for assertions
- ✅ Review panel displays assertions with purple ✅ icon
- ✅ Assertion details shown (type, description, expected value)
- ✅ Code generator processes assertion events

**Code Generation Templates:**
- ✅ **Playwright (Python)**: Native expect() API with assertions

**Example Generated Code:**
```python
# Playwright
await expect(self.page.locator('#success-msg')).to_contain_text("Success")
```

### 📚 Documentation Updates

**New Documentation:**
- ✅ `ASSERTIONS_GUIDE.md` - Comprehensive user guide with best practices
- ✅ `CHANGELOG.md` - This file

**Updated Documentation:**
- ✅ `README.md` - Added assertion feature to core functionality
- ✅ `ENTERPRISE_PITCH.md` - Updated enterprise readiness section, added assertion UVP
- ✅ `TechSpecs/TestCaptive_Complete_Technical_Spec.md` - Updated data flow and features
- ✅ `FINAL_STRUCTURE.md` - Added assertion feature to key changes
- ✅ `architecture/README.md` - Updated diagram descriptions
- ✅ `architecture/current-architecture.puml` - Added assertion notes
- ✅ `architecture/enterprise-vision.puml` - Enhanced AI service notes
- ✅ `architecture/user-workflow.puml` - Updated workflow with assertion steps

### 🎯 Business Impact

**Enterprise Readiness:**
- ✅ **Closed critical gap** - "No Assertions" issue resolved
- ✅ **Competitive advantage** - Only recorder with built-in assertion capture
- ✅ **CI/CD ready** - Tests can now run without manual intervention
- ✅ **ROI multiplier** - Eliminates 2-4 hours of manual validation per test

**vs. Competition:**
| Feature | Selenium IDE | Playwright Inspector | Cypress Studio | TestCaptive |
|---------|-------------|---------------------|----------------|-------------|
| Record Actions | ✅ | ✅ | ✅ | ✅ |
| Assertion Capture | Manual only | Manual only | Limited | **7 types** ✅ |
| Context Menu | ❌ | ❌ | ❌ | ✅ |

**ROI Enhancement:**
- **Before**: Manual assertion writing (2-4 hours per test)
- **After**: Capture during recording (0 additional time)
- **Savings**: 100% of assertion development time
- **Quality**: Industry-standard assertion patterns

### 🔧 Technical Implementation

**Architecture:**
```
User Right-Click → Chrome Context Menu → Assertion Event
    ↓
Session JSON (with assertions array)
    ↓
VSCode Import → Display Assertions → Generate Code
    ↓
Framework-Specific Assertion Code
```

**Type Safety:**
- New `AssertionType` enum (10 possible types)
- New `Assertion` interface with proper typing
- Enhanced `TestEvent` to include assertions
- Enhanced `SessionData` to store assertions array

**Code Quality:**
- Multi-pass template processing handles assertion conditionals
- Proper selector priority for assertion element lookup
- Framework-specific assertion syntax
- Clean, idiomatic output

### 🐛 Bug Fixes
- N/A (new feature)

### ⚠️ Breaking Changes
- None - backward compatible with existing sessions

### 🚀 Upgrade Path
1. Update Chrome extension (reload in `chrome://extensions`)
2. Update VSCode extension (reinstall VSIX)
3. Start using right-click → Assertions during recording
4. Generate code with embedded validations

### 📝 Notes for Users

**Getting Started:**
1. Record your test flow as normal
2. After key actions, right-click target element
3. Select "✅ TestCaptive Assertions"
4. Choose assertion type
5. Enter expected value (if prompted)
6. See green confirmation
7. Continue recording
8. Import session and see assertions in review panel
9. Generate code - assertions are included!

**Best Practices:**
- Add assertions after critical actions (login, submit, navigation)
- Use "contains" for dynamic content
- Validate success states (messages, URL changes)
- Don't over-assert (focus on business-critical validations)

### 🎯 Next Steps

**Potential Enhancements:**
- AI-powered assertion suggestions (analyze DOM changes)
- Bulk assertion import/export
- Assertion templates/presets
- Custom assertion types
- Visual regression integration
- API response validation

---

## [1.0.0] - December 2025 - Initial Release

### Initial Features
- Chrome extension with event capture
- VSCode extension with code generation
- Playwright support
- Smart selector priority algorithm
- Test data extraction
- Session management
- Template-based code generation
- Production-ready build system

---

**Legend:**
- ✅ Implemented
- 🚧 In Progress
- 📋 Planned
- ❌ Deprecated
