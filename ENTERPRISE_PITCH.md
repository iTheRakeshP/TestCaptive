# TestCaptive - Enterprise Pitch

## What It Does

TestCaptive records user interactions in Chrome and generates production-ready Playwright (Python) test scripts in VS Code. No server required — fully offline, file-based workflow.

## What's Implemented (v1.2.0)

| Feature | Status | Description |
|---------|--------|-------------|
| Smart Event Capture | ✅ | Action-based recording (fill, check, select) with deduplication |
| Assertion Capture | ✅ | 7 types via right-click context menu during recording |
| Playwright Code Gen | ✅ | Template-based, nesting-aware, clean output |
| Smart Selectors | ✅ | 6-level priority: testid → aria → id → name → xpath → CSS |
| Test Data Extraction | ✅ | Automatic parameterized test data as JSON |
| VS Code Integration | ✅ | Split-pane UI: import, review events, export code |
| Session Management | ✅ | Portable JSON session files |
| Offline Mode | ✅ | No WebSocket, no server, no cloud dependency |

## Value Proposition

**Problem:** Manual test automation is slow (8-16 hours/test) and requires specialized SDETs.

**Solution:** Record once, generate tests. QA analysts can create Playwright tests without writing code.

| Metric | Manual | TestCaptive |
|--------|--------|-------------|
| Time per test | 8-16 hours | 30 min - 1 hour |
| Skill required | Senior SDET | QA Analyst |
| Assertion setup | Manual coding | Right-click capture |
| Maintenance trigger | Manual re-coding | Re-record + regenerate |

## Competitive Position

| Feature | TestCaptive | Selenium IDE | Playwright Inspector |
|---------|-------------|--------------|---------------------|
| Smart selectors | ✅ 6-level priority | Basic | Basic |
| Assertion capture | ✅ 7 types | Manual | Manual |
| IDE integration | ✅ VS Code | Browser only | Browser only |
| Open source | ✅ MIT | Apache 2.0 | Apache 2.0 |
| Action coalescing | ✅ fill/check/select | Raw events | Code output |
| Cost | Free | Free | Free |

## What's Not Built Yet

These are areas for future development if there's interest:

- **CI/CD integration** — Auto-commit generated tests, trigger pipelines
- **Collaboration** — Shared sessions, review workflows, team workspaces
- **Self-healing tests** — Auto-detect and fix broken selectors
- **Multi-browser** — Firefox and Safari extension support
- **Analytics dashboard** — Test coverage, flaky test detection, ROI metrics
- **AI suggestions** — Auto-generate assertions from DOM changes

## Architecture

```
Chrome Extension          VS Code Extension
┌─────────────────┐      ┌──────────────────────┐
│ content.ts       │      │ extension.ts          │
│ - Event capture  │      │ - Session import      │
│ - Fill coalesce  │      │                       │
│ - Click suppress │  JSON│ code-generator.ts     │
│ - Assertions     │─────►│ - Template engine     │
│                  │ file │ - Smart coalescence   │
│ background.ts    │      │ - Selector priority   │
│ - Session mgmt   │      │                       │
│ - JSON export    │      │ review-panel.ts       │
└─────────────────┘      │ - Split-pane UI       │
                          └──────────────────────┘
                                    │
                                    ▼
                          Playwright Python Tests
```

## Quick Demo

1. Open `demo.html` in Chrome with TestCaptive recording
2. Fill the form, click submit, right-click to add assertions
3. Import the session JSON in VS Code
4. Generated test code is ready to copy and run
