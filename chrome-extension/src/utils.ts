// Utility functions for TestCaptive Chrome Extension
import { ElementInfo } from './types';

// ===== PII / Sensitive Data Redaction =====

const SENSITIVE_INPUT_TYPES = new Set([
  'password', 'credit-card', 'cc-number', 'cc-exp', 'cc-csc', 'ssn'
]);

const SENSITIVE_AUTOCOMPLETE_VALUES = new Set([
  'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc',
  'cc-name', 'cc-type', 'new-password', 'current-password'
]);

const SENSITIVE_NAME_PATTERNS = /password|passwd|pwd|secret|token|ssn|social.?security|credit.?card|card.?number|cvv|cvc|csc|expir/i;

/**
 * Check if an element contains sensitive/PII data that should be redacted.
 */
export function isSensitiveField(element: HTMLElement): boolean {
  const inputType = (element as HTMLInputElement).type?.toLowerCase() || '';
  if (SENSITIVE_INPUT_TYPES.has(inputType)) return true;

  const autocomplete = element.getAttribute('autocomplete')?.toLowerCase() || '';
  if (SENSITIVE_AUTOCOMPLETE_VALUES.has(autocomplete)) return true;

  const name = (element as HTMLInputElement).name || '';
  const id = element.id || '';
  const placeholder = (element as HTMLInputElement).placeholder || '';
  const ariaLabel = element.getAttribute('aria-label') || '';

  if (SENSITIVE_NAME_PATTERNS.test(name) ||
      SENSITIVE_NAME_PATTERNS.test(id) ||
      SENSITIVE_NAME_PATTERNS.test(placeholder) ||
      SENSITIVE_NAME_PATTERNS.test(ariaLabel)) {
    return true;
  }

  return false;
}

/**
 * Redact a value if the element is a sensitive field.
 * Returns "[REDACTED]" for sensitive fields, original value otherwise.
 */
export function redactIfSensitive(value: string, element: HTMLElement): string {
  if (!value) return value;
  if (isSensitiveField(element)) return '[REDACTED]';
  return value;
}

// ===== Dynamic ID Detection =====

// Patterns that indicate a dynamically-generated ID (React, Angular, Vue, Emotion, etc.)
const DYNAMIC_ID_PATTERNS = [
  /^:r[0-9a-z]+:$/,              // React 18+ useId()
  /^react-/,                      // React legacy
  /^ng-/,                         // Angular
  /^_ng[a-z]+-/,                  // Angular CDK
  /^mat-/,                        // Angular Material
  /^cdk-/,                        // Angular CDK
  /^ember\d+$/,                   // Ember
  /^__next/,                      // Next.js
  /^[a-z]{1,3}-[a-f0-9]{4,}$/i,  // Generic hash-based IDs
  /^[0-9a-f]{8}-[0-9a-f]{4}/,    // UUID prefix
  /^\d+$/,                         // Pure numeric IDs
];

const DYNAMIC_CLASS_PATTERNS = [
  /^css-[a-z0-9]+$/,              // Emotion CSS-in-JS
  /^sc-[a-zA-Z]+$/,               // Styled-components
  /^_[a-zA-Z0-9]{5,}$/,           // CSS Modules hash
  /^svelte-[a-z0-9]+$/,           // Svelte
  /^tw-[a-z0-9]+$/,               // Tailwind hash
];

/**
 * Check if an ID looks dynamically generated and therefore unstable for selectors.
 */
export function isDynamicId(id: string): boolean {
  if (!id) return false;
  return DYNAMIC_ID_PATTERNS.some(pattern => pattern.test(id));
}

/**
 * Check if a CSS class looks dynamically generated.
 */
export function isDynamicClass(className: string): boolean {
  if (!className) return false;
  return DYNAMIC_CLASS_PATTERNS.some(pattern => pattern.test(className));
}

// ===== Selector Generation =====

/**
 * Escape special characters in CSS selector values.
 */
export function escapeCSSValue(value: string): string {
  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

/**
 * Generate the best CSS selector for an element, following priority:
 * 1. data-testid / data-test-id
 * 2. aria-label
 * 3. Stable ID (not dynamic)
 * 4. name attribute
 * 5. Role + text combination
 * 6. Stable class selector with tag
 * 7. Tag + nth-child fallback
 *
 * Each candidate is validated for uniqueness before returning.
 * If a candidate matches multiple elements, it falls through to the next level.
 */
export function generateSelector(element: Element): string {
  const candidates: string[] = [];

  // 1. data-testid (strongest contract)
  const testId = element.getAttribute('data-testid') || element.getAttribute('data-test-id');
  if (testId) {
    candidates.push(`[data-testid="${escapeCSSValue(testId)}"]`);
  }

  // 2. aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    candidates.push(`[aria-label="${escapeCSSValue(ariaLabel)}"]`);
  }

  // 3. Stable ID
  if (element.id && !isDynamicId(element.id)) {
    candidates.push(`#${escapeCSSValue(element.id)}`);
  }

  // 4. name attribute (for radio buttons, include value to disambiguate radio groups)
  const name = element.getAttribute('name');
  if (name) {
    const tag = element.tagName.toLowerCase();
    const inputType = (element as HTMLInputElement).type?.toLowerCase();
    const inputValue = element.getAttribute('value');
    if (inputType === 'radio' && inputValue) {
      candidates.push(`${tag}[name="${escapeCSSValue(name)}"][value="${escapeCSSValue(inputValue)}"]`);
    } else {
      candidates.push(`${tag}[name="${escapeCSSValue(name)}"]`);
    }
  }

  // 5. Role + accessible name
  const role = element.getAttribute('role');
  if (role) {
    const text = element.textContent?.trim().substring(0, 50);
    if (text) {
      candidates.push(`[role="${role}"]`);
    }
  }

  // 6. Stable class-based selector
  const tag = element.tagName.toLowerCase();
  if (element.className && typeof element.className === 'string') {
    const stableClasses = element.className
      .split(' ')
      .filter(c => c.trim() && !isDynamicClass(c.trim()))
      .slice(0, 2);
    if (stableClasses.length > 0) {
      candidates.push(tag + '.' + stableClasses.map(c => escapeCSSValue(c)).join('.'));
    }
  }

  // Validate candidates for uniqueness
  for (const candidate of candidates) {
    try {
      const matches = document.querySelectorAll(candidate);
      if (matches.length === 1) {
        return candidate;
      }
    } catch (_) {
      // Invalid selector, skip
    }
  }

  // If no unique candidate, try refining the best one with :nth-of-type
  for (const candidate of candidates) {
    try {
      const matches = document.querySelectorAll(candidate);
      if (matches.length > 1) {
        const idx = Array.from(matches).indexOf(element);
        if (idx >= 0) {
          return `${candidate}:nth-of-type(${idx + 1})`;
        }
      }
    } catch (_) { /* skip */ }
  }

  // 7. Tag + nth-child fallback (always unique)
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      el => el.tagName === element.tagName
    );
    const index = siblings.indexOf(element) + 1;
    if (siblings.length > 1) {
      return `${tag}:nth-child(${index})`;
    }
  }

  return tag;
}

// ===== XPath Generation =====

/**
 * Generate a stable XPath for an element.
 * Prefers ID-based short XPaths when IDs are stable.
 */
export function generateXPath(element: Element): string {
  // Short XPath via stable ID
  if (element.id && !isDynamicId(element.id)) {
    return `//*[@id="${element.id}"]`;
  }

  // Short XPath via data-testid
  const testId = element.getAttribute('data-testid') || element.getAttribute('data-test-id');
  if (testId) {
    return `//*[@data-testid="${testId}"]`;
  }

  if (element === document.body) {
    return '/html/body';
  }
  if (element === document.documentElement) {
    return '/html';
  }

  // Positional XPath
  let ix = 0;
  const siblings = element.parentNode ? element.parentNode.childNodes : [];

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      const parentXPath = element.parentNode && element.parentNode !== document
        ? generateXPath(element.parentNode as Element)
        : '';
      return `${parentXPath}/${element.tagName.toLowerCase()}[${ix + 1}]`;
    }
    if (sibling.nodeType === 1 && (sibling as Element).tagName === element.tagName) {
      ix++;
    }
  }
  return '';
}

// ===== Shadow DOM Support =====

/**
 * Get the element info even if it's inside a Shadow DOM.
 * Returns the host element path for context.
 */
export function getShadowHostPath(element: Element): string | null {
  const root = element.getRootNode();
  if (root instanceof ShadowRoot) {
    const host = root.host;
    const hostSelector = generateSelector(host);
    const parentPath = getShadowHostPath(host);
    return parentPath ? `${parentPath} >> ${hostSelector}` : hostSelector;
  }
  return null;
}

/**
 * Build a complete element info object from a DOM element.
 */
export function getElementInfo(element: Element): ElementInfo {
  const el = element as HTMLElement;
  const inputEl = element as HTMLInputElement;

  return {
    tag: el.tagName?.toLowerCase() || '',
    id: el.id || '',
    className: (typeof el.className === 'string' ? el.className : '') || '',
    text: el.textContent?.substring(0, 100)?.trim() || '',
    value: inputEl.value || '',
    type: inputEl.type || '',
    name: inputEl.name || '',
    placeholder: inputEl.placeholder || '',
    testid: el.getAttribute('data-testid') || el.getAttribute('data-test-id') || '',
    ariaLabel: el.getAttribute('aria-label') || '',
    role: el.getAttribute('role') || '',
    xpath: generateXPath(element),
    cssSelector: generateSelector(element),
    checked: inputEl.checked,
    href: (el as HTMLAnchorElement).href || '',
    src: (el as HTMLImageElement).src || '',
    isContentEditable: el.isContentEditable || false,
  };
}
