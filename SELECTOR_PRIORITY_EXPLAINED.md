# TestCaptive Element Selector Priority Algorithm

## Overview
TestCaptive uses a **hierarchical fallback system** to select the best, most reliable element locator for test automation. This ensures tests are robust, maintainable, and less likely to break when UI changes.

---

## Priority Ranking (Strongest → Weakest)

### 1️⃣ **Test ID** (`data-testid` or `testid` attribute)
- **Why First?** Explicitly added by developers for testing purposes
- **Stability:** 🟢 Very High - Rarely changes
- **Uniqueness:** 🟢 Guaranteed unique per component
- **Example:**
  - Playwright: `page.get_by_test_id("input-first-name")`

### 2️⃣ **ARIA Label** (`aria-label` attribute)
- **Why Second?** Accessibility-first, semantic identifier
- **Stability:** 🟢 High - Part of accessibility contract
- **Uniqueness:** 🟡 Usually unique within context
- **Example:**
  - Playwright: `page.get_by_label("First Name")`

### 3️⃣ **ID** (`id` attribute)
- **Why Third?** Traditionally unique, but can change
- **Stability:** 🟡 Medium - May be auto-generated or refactored
- **Uniqueness:** 🟢 Should be unique per page (HTML spec)
- **Example:**
  - Playwright: `page.click('#firstName')`

### 4️⃣ **Name** (`name` attribute)
- **Why Fourth?** Common for form elements, but not guaranteed unique
- **Stability:** 🟡 Medium - Backend-driven, may change with API
- **Uniqueness:** 🟠 Often duplicated (radio buttons, checkboxes)
- **Example:**
  - Playwright: `page.fill('[name="firstName"]', 'value')`

### 5️⃣ **XPath**
- **Why Fifth?** Powerful but fragile
- **Stability:** 🔴 Low - DOM structure changes break XPath
- **Uniqueness:** 🟢 Can be made unique
- **Example:**
  - Playwright: `page.locator('xpath=//*[@id="firstName"]')`
- **Warning:** Absolute XPaths like `/html/body/div[2]/form/input[1]` are extremely brittle

### 6️⃣ **CSS Selector** (Fallback)
- **Why Last?** Generic, often includes layout-specific classes
- **Stability:** 🔴 Very Low - CSS classes change frequently for styling
- **Uniqueness:** 🔴 Rarely unique
- **Example:**
  - Playwright: `page.click('input.form-control')`

---

## How It Works in Code

### Template-Based Conditional Chain

Each test framework template uses a **conditional chain** that checks element properties in priority order:

```python
# Playwright Template Example (playwright_template.py)
{{#if element.testid}}
await self.page.get_by_test_id("{{element.testid}}").click()
{{else if element.ariaLabel}}
await self.page.get_by_label("{{element.ariaLabel}}").click()
{{else if element.id}}
await self.page.click('#{{element.id}}')
{{else if element.name}}
await self.page.click('[name="{{element.name}}"]')
{{else if element.xpath}}
await self.page.locator('xpath={{element.xpath}}').click()
{{else}}
await self.page.click('{{element.cssSelector}}')
{{/if}}
```

### Code Generator Processing

The `code-generator.ts` processes these templates through a chain matcher:

1. **Playwright Chain:** `testid → ariaLabel → id → name → xpath → cssSelector`

The matcher:
- Checks if the property exists on `event.element`
- Selects the **first matching branch**
- Removes unmatched `{{else if}}` branches
- Replaces `{{element.property}}` placeholders with actual values

---

## Algorithm Strengths

### ✅ Current Strengths

1. **Playwright-Optimized:** Full 6-level priority chain for best selector coverage
2. **Graceful Degradation:** Falls back through 6 levels before giving up
3. **Template-Driven:** Easy to customize priority
4. **Multi-Pass Processing:** Handles nested conditionals correctly
5. **Clean Output:** Orphaned template tags are removed

### Room for Improvement

- **No weighting system** — Currently binary (property exists vs. doesn't). Could score selectors by uniqueness/stability.
- **No validation** — Doesn't verify selector uniqueness during capture. Could count matching elements.
- **Hard-coded priority** — Cannot be customized per project. Could allow user configuration.
- **No context awareness** — Doesn't use parent/sibling relationships for more resilient selectors.

---

## Example

Given this HTML:
```html
<input
  id="firstName"
  name="firstName"
  class="form-control input-lg"
  data-testid="input-first-name"
  aria-label="First Name"
/>
```

**Behavior:** Checks `data-testid="input-first-name"` → found → stops.

**Generated:** `page.get_by_test_id("input-first-name")`

If `data-testid` were missing, it would try `aria-label`, then `id`, then `name`, then `xpath`, then CSS selector.

**If `data-testid` was missing:**
1. ❌ No `data-testid`
2. ✅ Checks `aria-label="First Name"` → **FOUND**

---

## Summary

| Priority | Attribute | Playwright | Stability | Why? |
|----------|-----------|:----------:|-----------|------|
| 🥇 1st | `data-testid` | ✅ | 🟢 Very High | Explicit test identifier |
| 🥈 2nd | `aria-label` | ✅ | 🟢 High | Accessibility standard |
| 🥉 3rd | `id` | ✅ | 🟡 Medium | Should be unique |
| 4th | `name` | ✅ | 🟡 Medium | Form element identifier |
| 5th | `xpath` | ✅ | 🔴 Low | Fragile to DOM changes |
| 6th | `cssSelector` | ✅ | 🔴 Very Low | Last resort |

**Current Algorithm:** ✅ **Strong and production-ready**
**Potential Improvements:** 🔄 **Validation, scoring, and context-awareness**

---

## Testing the Algorithm

Run the test script to see selector priority in action:
```powershell
cd vscode-extension
node regenerate-tests.js
```

Check the generated files in `Test-Code/` to see which selectors were chosen for each event.
