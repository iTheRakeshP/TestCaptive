// TestCaptive Enterprise Content Script
// Captures DOM events, generates selectors, detects SPA navigation,
// supports Shadow DOM, iframes, file uploads, drag-drop, dialogs,
// and provides PII redaction for sensitive fields.

import { RecordedEvent, ElementInfo, RecordedEventType } from './types';
import {
  getElementInfo,
  generateSelector,
  generateXPath,
  isSensitiveField,
  redactIfSensitive,
  getShadowHostPath,
  isDynamicId
} from './utils';

(function () {
  'use strict';

  // Prevent multiple loads
  if ((window as any).__TESTCAPTIVE_LOADED__) return;
  (window as any).__TESTCAPTIVE_LOADED__ = true;

  console.log('🎯 TestCaptive Content Script Loaded');

  // ===== Detection Flag =====
  function setDetectionFlag(): void {
    (window as any).testCaptiveContentScript = true;
    try {
      sessionStorage.setItem('testCaptiveActive', 'true');
    } catch (_) { /* ignore in restricted contexts */ }
    try {
      if (document.head && !document.getElementById('__testcaptive_flag__')) {
        const flag = document.createElement('meta');
        flag.id = '__testcaptive_flag__';
        flag.name = 'testcaptive-detected';
        flag.content = 'true';
        document.head.appendChild(flag);
      }
    } catch (_) { /* ignore */ }
  }
  setDetectionFlag();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setDetectionFlag);
  }
  window.addEventListener('load', setDetectionFlag);

  // ===== Constants =====
  const MAX_EVENTS = 10000; // Memory safety limit
  const SCROLL_DEBOUNCE = 300;
  const FILL_COMMIT_DELAY = 1500; // Commit fill after 1500ms of inactivity

  // ===== State =====
  let isRecording = false;
  let sessionId: string | null = null;
  let recordedEvents: RecordedEvent[] = [];
  let rightClickedElement: Element | null = null;

  // Action builder state (Playwright codegen-style)
  interface PendingFillAction {
    element: HTMLElement;
    selector: string;
    elementInfo: ElementInfo;
    timestamp: string;
    value: string;
    page: { url: string; title: string; scrollX?: number; scrollY?: number };
    position?: { x: number; y: number; width: number; height: number };
    iframeContext?: string;
  }
  let pendingFill: PendingFillAction | null = null;
  let fillCommitTimer: ReturnType<typeof setTimeout> | null = null;

  // Scroll tracking state
  let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastScrollPosition = { x: 0, y: 0 };

  // Dedup state
  let lastEmittedEvent: { type: string; selector: string; timestamp: number } | null = null;

  // SPA navigation state
  let lastUrl = window.location.href;

  // Dialog interception state
  let originalAlert: typeof window.alert;
  let originalConfirm: typeof window.confirm;
  let originalPrompt: typeof window.prompt;

  // ===== Helpers =====

  /** Check if an element is a text-like input that should use fill() */
  function isTextLikeInput(element: HTMLElement): boolean {
    const tag = element.tagName;
    if (tag === 'TEXTAREA') return true;
    if (element.isContentEditable) return true;
    if (tag === 'INPUT') {
      const type = (element as HTMLInputElement).type?.toLowerCase() || 'text';
      return ['text', 'password', 'email', 'search', 'tel', 'url', 'number'].includes(type);
    }
    return false;
  }

  /** Check if element is a clickable interactive element (not a text input) */
  function isClickableElement(element: HTMLElement): boolean {
    const tag = element.tagName;
    if (tag === 'BUTTON') return true;
    if (tag === 'A') return true;
    if (tag === 'SUMMARY') return true;
    if (element.getAttribute('role') === 'button') return true;
    if (element.getAttribute('role') === 'link') return true;
    if (element.getAttribute('role') === 'tab') return true;
    if (element.getAttribute('role') === 'menuitem') return true;
    if (tag === 'INPUT') {
      const type = (element as HTMLInputElement).type?.toLowerCase();
      return ['submit', 'button', 'reset', 'image'].includes(type || '');
    }
    return false;
  }

  /** Get the same-element identity key for dedup */
  function getElementKey(element: HTMLElement): string {
    const info = getElementInfo(element);
    return info.testid || info.id || info.name || generateSelector(element);
  }

  // ===== Pending Fill Management =====

  function commitPendingFill(): void {
    if (fillCommitTimer) {
      clearTimeout(fillCommitTimer);
      fillCommitTimer = null;
    }
    if (!pendingFill) return;

    // Only emit if there's actually a value (user typed something)
    if (pendingFill.value) {
      const safeValue = redactIfSensitive(pendingFill.value, pendingFill.element);

      // Redact element value in info if sensitive
      const elementInfo = { ...pendingFill.elementInfo };
      if (isSensitiveField(pendingFill.element)) {
        elementInfo.value = '[REDACTED]';
      }

      const eventData: RecordedEvent = {
        type: 'fill',
        timestamp: pendingFill.timestamp,
        element: elementInfo,
        page: pendingFill.page,
        sessionId: sessionId!,
        selector: pendingFill.selector,
        inputValue: safeValue,
        position: pendingFill.position,
        iframeContext: pendingFill.iframeContext
      };

      emitEvent(eventData);
    }

    pendingFill = null;
  }

  function scheduleFillCommit(): void {
    if (fillCommitTimer) clearTimeout(fillCommitTimer);
    fillCommitTimer = setTimeout(commitPendingFill, FILL_COMMIT_DELAY);
  }

  // ===== Core Event Emission =====

  function emitEvent(eventData: RecordedEvent): void {
    // Enforce memory limit
    if (recordedEvents.length >= MAX_EVENTS) {
      console.warn(`⚠️ TestCaptive: Max events (${MAX_EVENTS}) reached. Stopping capture.`);
      return;
    }

    // Basic dedup: skip exact same event type + selector within 150ms
    const now = Date.now();
    if (lastEmittedEvent &&
        lastEmittedEvent.type === eventData.type &&
        lastEmittedEvent.selector === (eventData.selector || '') &&
        (now - lastEmittedEvent.timestamp) < 150) {
      return;
    }

    recordedEvents.push(eventData);
    lastEmittedEvent = {
      type: eventData.type,
      selector: eventData.selector || '',
      timestamp: now
    };

    try {
      chrome.runtime.sendMessage({
        type: 'event-captured',
        data: eventData
      });
    } catch (e) {
      console.warn('TestCaptive: Failed to send event to background:', e);
    }

    console.log('📤 Event captured:', eventData.type, eventData.element?.tag || '', eventData.inputValue || '');
  }

  // ===== Message Handler =====

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'start-recording':
        startRecording(message.sessionId);
        sendResponse({ success: true });
        break;

      case 'stop-recording':
        commitPendingFill();
        const eventCount = stopRecording();
        sendResponse({ success: true, eventCount });
        break;

      case 'ping':
        sendResponse({
          success: true,
          isRecording,
          sessionId,
          eventCount: recordedEvents.length
        });
        break;

      case 'add-assertion':
        if (isRecording && message.assertion) {
          addAssertion(message.assertion);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Not recording or invalid assertion' });
        }
        break;

      case 'create-text-assertion':
        if (isRecording && rightClickedElement) {
          createTextAssertion(message.assertionType, rightClickedElement);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
        break;

      case 'create-simple-assertion':
        if (isRecording && rightClickedElement) {
          createSimpleAssertion(message.assertionType, rightClickedElement);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
    return true;
  });

  // ===== Recording Lifecycle =====

  function startRecording(newSessionId: string): void {
    isRecording = true;
    sessionId = newSessionId;
    recordedEvents = [];

    // Reset action builder state
    pendingFill = null;
    if (fillCommitTimer) {
      clearTimeout(fillCommitTimer);
      fillCommitTimer = null;
    }
    lastEmittedEvent = null;

    lastUrl = window.location.href;

    attachEventListeners();
    attachSPAListeners();
    attachDialogInterceptors();
    highlightRecordableElements();

    console.log('🔴 Recording started:', sessionId);
  }

  function stopRecording(): number {
    isRecording = false;
    const eventCount = recordedEvents.length;

    removeEventListeners();
    removeSPAListeners();
    removeDialogInterceptors();
    removeHighlights();

    console.log('⏹️ Recording stopped. Events captured:', eventCount);
    sessionId = null;
    recordedEvents = [];
    return eventCount;
  }

  // ===== Smart Event Capture (Playwright codegen-style) =====

  function captureEvent(event: Event): void {
    if (!isRecording || !sessionId) return;

    try {
      const element = event.target as HTMLElement;
      if (!element || !element.tagName) return;

      const eventType = event.type;

      // ---- Focus / Blur: only used as commit triggers, never emitted ----
      if (eventType === 'focus') {
        // If user focused a different element, commit any pending fill
        if (pendingFill && element !== pendingFill.element) {
          commitPendingFill();
        }
        return;
      }

      if (eventType === 'blur') {
        // Commit pending fill when user leaves the field
        if (pendingFill && element === pendingFill.element) {
          commitPendingFill();
        }
        return;
      }

      // ---- Build common event data ----
      const rect = element.getBoundingClientRect();
      const elementInfo = getElementInfo(element);
      const iframeContext = getIframeContext();
      const selector = generateSelector(element);
      const shadowPath = getShadowHostPath(element);
      const fullSelector = shadowPath ? `${shadowPath} >> ${selector}` : selector;

      const page = {
        url: window.location.href,
        title: document.title,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      };

      const position = {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };

      // ---- Input event: accumulate into pending fill ----
      if (eventType === 'input') {
        handleSmartInput(element, elementInfo, fullSelector, page, position, iframeContext || undefined);
        return;
      }

      // ---- Change event: select, checkbox, radio, file ----
      if (eventType === 'change') {
        handleSmartChange(element, elementInfo, fullSelector, page, position, iframeContext || undefined);
        return;
      }

      // ---- Click event: smart routing ----
      if (eventType === 'click') {
        handleSmartClick(event as MouseEvent, element, elementInfo, fullSelector, page, position, iframeContext || undefined);
        return;
      }

      // ---- Double-click ----
      if (eventType === 'dblclick') {
        commitPendingFill();
        emitEvent({
          type: 'dblclick',
          timestamp: new Date().toISOString(),
          element: elementInfo,
          page,
          sessionId: sessionId!,
          selector: fullSelector,
          position,
          iframeContext: iframeContext || undefined
        });
        return;
      }

      // ---- Keydown: smart filtering ----
      if (eventType === 'keydown') {
        handleSmartKeydown(event as KeyboardEvent, element, elementInfo, fullSelector, page, position, iframeContext || undefined);
        return;
      }

      // ---- Submit ----
      if (eventType === 'submit') {
        commitPendingFill();
        emitEvent({
          type: 'submit',
          timestamp: new Date().toISOString(),
          element: elementInfo,
          page,
          sessionId: sessionId!,
          selector: fullSelector,
          position,
          iframeContext: iframeContext || undefined
        });
        return;
      }

    } catch (error) {
      console.error('TestCaptive: Error capturing event:', error);
    }
  }

  // ===== Smart Click Handler =====

  function handleSmartClick(
    event: MouseEvent,
    element: HTMLElement,
    elementInfo: ElementInfo,
    selector: string,
    page: any,
    position: any,
    iframeContext?: string
  ): void {
    if (isTextLikeInput(element)) {
      // Click on a text field: start pending fill, DON'T emit click
      // (Like Playwright codegen: clicking a text field just prepares for fill)
      if (pendingFill && pendingFill.element === element) {
        // Re-clicked same field, ignore
        return;
      }
      // Commit any previous pending fill (different field)
      commitPendingFill();
      // Start new pending fill for this element
      pendingFill = {
        element,
        selector,
        elementInfo,
        timestamp: new Date().toISOString(),
        value: (element as HTMLInputElement).value || '',
        page,
        position,
        iframeContext
      };
      return;
    }

    // Click on <select> element: suppress (the 'select' change event captures the action)
    if (element.tagName === 'SELECT') {
      return;
    }

    // Non-text click: commit any pending fill, then emit click
    commitPendingFill();

    // PII redaction for element info
    if (isSensitiveField(element)) {
      elementInfo.value = '[REDACTED]';
    }

    emitEvent({
      type: 'click',
      timestamp: new Date().toISOString(),
      element: elementInfo,
      page,
      sessionId: sessionId!,
      selector,
      position,
      clickPosition: {
        clientX: event.clientX,
        clientY: event.clientY
      },
      iframeContext
    });
  }

  // ===== Smart Input Handler =====

  function handleSmartInput(
    element: HTMLElement,
    elementInfo: ElementInfo,
    selector: string,
    page: any,
    position: any,
    iframeContext?: string
  ): void {
    const inputEl = element as HTMLInputElement;

    // Skip input events for non-text elements (they use change events)
    if (element.tagName === 'SELECT' || inputEl.type === 'checkbox' || inputEl.type === 'radio') {
      return;
    }

    const currentValue = inputEl.value || (element as HTMLElement).textContent || '';

    if (pendingFill && pendingFill.element === element) {
      // Same field: just update the value (no event emitted)
      pendingFill.value = currentValue;
      pendingFill.timestamp = new Date().toISOString();
      scheduleFillCommit();
    } else {
      // User tabbed or otherwise focused a new text field without clicking
      commitPendingFill();
      pendingFill = {
        element,
        selector,
        elementInfo,
        timestamp: new Date().toISOString(),
        value: currentValue,
        page,
        position,
        iframeContext
      };
      scheduleFillCommit();
    }
  }

  // ===== Smart Change Handler =====

  function handleSmartChange(
    element: HTMLElement,
    elementInfo: ElementInfo,
    selector: string,
    page: any,
    position: any,
    iframeContext?: string
  ): void {
    const inputEl = element as HTMLInputElement;
    const tag = element.tagName;

    // SELECT element → emit 'select'
    if (tag === 'SELECT') {
      commitPendingFill();
      const selectEl = element as HTMLSelectElement;
      const selectedOptions = Array.from(selectEl.selectedOptions).map(o => o.text);
      elementInfo.selectedOptions = selectedOptions;

      emitEvent({
        type: 'select',
        timestamp: new Date().toISOString(),
        element: elementInfo,
        page,
        sessionId: sessionId!,
        selector,
        value: selectEl.value,
        inputValue: selectEl.value,
        position,
        iframeContext
      });
      return;
    }

    // Checkbox / Radio → emit 'check'
    if (inputEl.type === 'checkbox' || inputEl.type === 'radio') {
      commitPendingFill();
      elementInfo.checked = inputEl.checked;

      emitEvent({
        type: 'check',
        timestamp: new Date().toISOString(),
        element: elementInfo,
        page,
        sessionId: sessionId!,
        selector,
        value: String(inputEl.checked),
        position,
        iframeContext
      });
      return;
    }

    // File input → emit 'file-upload'
    if (inputEl.type === 'file' && inputEl.files && inputEl.files.length > 0) {
      commitPendingFill();
      emitEvent({
        type: 'file-upload',
        timestamp: new Date().toISOString(),
        element: elementInfo,
        page,
        sessionId: sessionId!,
        selector,
        files: Array.from(inputEl.files).map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
        position,
        iframeContext
      });
      return;
    }

    // Text-like change: ignore (handled by fill action via input events)
  }

  // ===== Smart Keydown Handler =====

  function handleSmartKeydown(
    event: KeyboardEvent,
    element: HTMLElement,
    elementInfo: ElementInfo,
    selector: string,
    page: any,
    position: any,
    iframeContext?: string
  ): void {
    const key = event.key;

    // Tab: only used as a commit trigger, never recorded
    // (Tab between fields is implicit in fill→fill sequence, like Playwright)
    if (key === 'Tab') {
      commitPendingFill();
      return;
    }

    // Enter: context-dependent
    if (key === 'Enter') {
      if (isTextLikeInput(element)) {
        // Enter in a text field first commits the fill, then records Enter
        // (useful for search boxes, form submit via Enter)
        commitPendingFill();
      }
      emitEvent({
        type: 'keydown',
        timestamp: new Date().toISOString(),
        element: elementInfo,
        page,
        sessionId: sessionId!,
        selector,
        value: 'Enter',
        position,
        iframeContext
      });
      return;
    }

    // Escape: always capture (closing modals, canceling)
    if (key === 'Escape') {
      commitPendingFill();
      emitEvent({
        type: 'keydown',
        timestamp: new Date().toISOString(),
        element: elementInfo,
        page,
        sessionId: sessionId!,
        selector,
        value: 'Escape',
        position,
        iframeContext
      });
      return;
    }

    // Keyboard shortcuts (Ctrl/Cmd + key): always capture
    const isShortcut = event.ctrlKey || event.metaKey || event.altKey;
    if (isShortcut) {
      const parts: string[] = [];
      if (event.ctrlKey) parts.push('Control');
      if (event.altKey) parts.push('Alt');
      if (event.shiftKey) parts.push('Shift');
      if (event.metaKey) parts.push('Meta');
      parts.push(key);

      emitEvent({
        type: 'keydown',
        timestamp: new Date().toISOString(),
        element: elementInfo,
        page,
        sessionId: sessionId!,
        selector,
        value: parts.join('+'),
        position,
        iframeContext
      });
      return;
    }

    // Other meaningful keys (arrows, F-keys, etc.) only outside text inputs
    const navigationKeys = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown',
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
    ]);

    if (navigationKeys.has(key) && !isTextLikeInput(element)) {
      emitEvent({
        type: 'keydown',
        timestamp: new Date().toISOString(),
        element: elementInfo,
        page,
        sessionId: sessionId!,
        selector,
        value: key,
        position,
        iframeContext
      });
    }

    // All other keystrokes in text fields are captured via the fill action
    // (individual keystrokes like 'a', 'b', etc. are NOT recorded)
  }

  // ===== Scroll Tracking =====

  function handleScroll(): void {
    if (!isRecording || !sessionId) return;

    if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = setTimeout(() => {
      const currentScroll = { x: window.scrollX, y: window.scrollY };
      // Only capture significant scrolls (> 200px change)
      const dx = Math.abs(currentScroll.x - lastScrollPosition.x);
      const dy = Math.abs(currentScroll.y - lastScrollPosition.y);
      if (dx < 200 && dy < 200) return;

      lastScrollPosition = currentScroll;

      const eventData: RecordedEvent = {
        type: 'scroll',
        timestamp: new Date().toISOString(),
        element: {
          tag: 'window', id: '', className: '', text: '', value: '',
          type: '', name: '', placeholder: '', testid: '', ariaLabel: '',
          role: '', xpath: ''
        },
        page: {
          url: window.location.href,
          title: document.title,
          scrollX: window.scrollX,
          scrollY: window.scrollY
        },
        sessionId: sessionId!,
        scrollPosition: currentScroll
      };
      emitEvent(eventData);
    }, SCROLL_DEBOUNCE);
  }

  // ===== Drag & Drop =====

  let dragSourceElement: Element | null = null;

  function handleDragStart(event: DragEvent): void {
    if (!isRecording) return;
    dragSourceElement = event.target as Element;
  }

  function handleDrop(event: DragEvent): void {
    if (!isRecording || !sessionId || !dragSourceElement) return;

    const dropTarget = event.target as Element;
    const eventData: RecordedEvent = {
      type: 'drag-drop',
      timestamp: new Date().toISOString(),
      element: getElementInfo(dropTarget),
      page: {
        url: window.location.href,
        title: document.title
      },
      sessionId: sessionId!,
      selector: generateSelector(dropTarget),
      dragSource: generateSelector(dragSourceElement),
      dropTarget: generateSelector(dropTarget)
    };

    emitEvent(eventData);
    dragSourceElement = null;
  }

  // ===== Hover Tracking (on interactive elements only) =====

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  function handleMouseEnter(event: MouseEvent): void {
    if (!isRecording || !sessionId) return;

    const element = event.target as HTMLElement;
    // Only track hovers on interactive elements (menus, dropdowns, tooltips)
    if (!isInteractiveHoverTarget(element)) return;

    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      const eventData: RecordedEvent = {
        type: 'hover',
        timestamp: new Date().toISOString(),
        element: getElementInfo(element),
        page: {
          url: window.location.href,
          title: document.title
        },
        sessionId: sessionId!,
        selector: generateSelector(element)
      };
      emitEvent(eventData);
    }, 500); // Only capture if hovered for 500ms+
  }

  function handleMouseLeave(): void {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  }

  function isInteractiveHoverTarget(element: HTMLElement): boolean {
    const role = element.getAttribute('role');
    if (role && ['menu', 'menubar', 'menuitem', 'tooltip', 'listbox', 'option'].includes(role)) {
      return true;
    }
    // Elements with hover-triggered visibility (e.g., dropdown menus)
    const tag = element.tagName.toLowerCase();
    if (tag === 'nav' || tag === 'menu') return true;
    // Has aria-haspopup
    if (element.getAttribute('aria-haspopup')) return true;
    return false;
  }

  // ===== SPA Navigation Detection =====

  function onSPANavigation(): void {
    if (!isRecording || !sessionId) return;

    const currentUrl = window.location.href;
    if (currentUrl === lastUrl) return;

    const eventData: RecordedEvent = {
      type: 'spa-navigation',
      timestamp: new Date().toISOString(),
      element: {
        tag: 'window', id: '', className: '', text: '', value: '',
        type: '', name: '', placeholder: '', testid: '', ariaLabel: '',
        role: '', xpath: ''
      },
      page: {
        url: currentUrl,
        title: document.title
      },
      sessionId: sessionId!
    };

    emitEvent(eventData);
    lastUrl = currentUrl;
  }

  // History API interception for pushState/replaceState
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  function patchedPushState(state: any, title: string, url?: string | URL | null): void {
    originalPushState(state, title, url);
    setTimeout(onSPANavigation, 0);
  }

  function patchedReplaceState(state: any, title: string, url?: string | URL | null): void {
    originalReplaceState(state, title, url);
    setTimeout(onSPANavigation, 0);
  }

  function attachSPAListeners(): void {
    window.addEventListener('popstate', onSPANavigation);
    window.addEventListener('hashchange', onSPANavigation);
    history.pushState = patchedPushState as typeof history.pushState;
    history.replaceState = patchedReplaceState as typeof history.replaceState;
  }

  function removeSPAListeners(): void {
    window.removeEventListener('popstate', onSPANavigation);
    window.removeEventListener('hashchange', onSPANavigation);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  }

  // ===== Dialog Interception =====

  function attachDialogInterceptors(): void {
    originalAlert = window.alert;
    originalConfirm = window.confirm;
    originalPrompt = window.prompt;

    window.alert = function (message?: any): void {
      captureDialog('alert', String(message ?? ''), '');
      return originalAlert.call(window, message);
    };

    window.confirm = function (message?: string): boolean {
      const result = originalConfirm.call(window, message);
      captureDialog('confirm', message || '', String(result));
      return result;
    };

    window.prompt = function (message?: string, defaultValue?: string): string | null {
      const result = originalPrompt.call(window, message, defaultValue);
      captureDialog('prompt', message || '', result || '');
      return result;
    };
  }

  function removeDialogInterceptors(): void {
    if (originalAlert) window.alert = originalAlert;
    if (originalConfirm) window.confirm = originalConfirm;
    if (originalPrompt) window.prompt = originalPrompt;
  }

  function captureDialog(dialogType: string, message: string, response: string): void {
    if (!isRecording || !sessionId) return;

    const eventData: RecordedEvent = {
      type: 'dialog',
      timestamp: new Date().toISOString(),
      element: {
        tag: 'dialog', id: '', className: '', text: message, value: '',
        type: dialogType, name: '', placeholder: '', testid: '', ariaLabel: '',
        role: 'alertdialog', xpath: ''
      },
      page: {
        url: window.location.href,
        title: document.title
      },
      sessionId: sessionId!,
      dialogType,
      dialogMessage: message,
      dialogResponse: response
    };

    emitEvent(eventData);
  }

  // ===== Iframe Context =====

  function getIframeContext(): string | null {
    try {
      if (window === window.top) return null;
      // We're in an iframe — try to get identifying info
      const frame = window.frameElement;
      if (frame) {
        const id = frame.id || frame.getAttribute('name') || '';
        const src = frame.getAttribute('src') || '';
        return id || src || 'anonymous-iframe';
      }
      return 'cross-origin-iframe';
    } catch (_) {
      return 'cross-origin-iframe';
    }
  }

  // ===== Event Listener Management =====

  const coreEventTypes = ['click', 'dblclick', 'input', 'change', 'submit', 'focus', 'blur', 'keydown'];
  const eventHandlers: Record<string, (e: Event) => void> = {};

  function attachEventListeners(): void {
    // Core DOM events
    coreEventTypes.forEach(eventType => {
      eventHandlers[eventType] = (e: Event) => captureEvent(e);
      document.addEventListener(eventType, eventHandlers[eventType], true);
    });

    // Scroll tracking
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Drag & drop
    document.addEventListener('dragstart', handleDragStart as EventListener, true);
    document.addEventListener('drop', handleDrop as EventListener, true);

    // Hover tracking (on interactive elements)
    document.addEventListener('mouseenter', handleMouseEnter as EventListener, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    // Right-click capture (for assertions)
    document.addEventListener('contextmenu', captureRightClick, true);

    console.log('🎯 Event listeners attached (enterprise mode)');
  }

  function removeEventListeners(): void {
    coreEventTypes.forEach(eventType => {
      if (eventHandlers[eventType]) {
        document.removeEventListener(eventType, eventHandlers[eventType], true);
      }
    });

    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('dragstart', handleDragStart as EventListener, true);
    document.removeEventListener('drop', handleDrop as EventListener, true);
    document.removeEventListener('mouseenter', handleMouseEnter as EventListener, true);
    document.removeEventListener('mouseleave', handleMouseLeave, true);
    document.removeEventListener('contextmenu', captureRightClick, true);

    if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
    if (hoverTimer) clearTimeout(hoverTimer);

    console.log('🎯 Event listeners removed');
  }

  // ===== Visual Highlighting =====

  function highlightRecordableElements(): void {
    if (!isRecording) return;

    const style = document.createElement('style');
    style.id = 'testcaptive-highlight-style';
    style.textContent = `
      .testcaptive-recordable {
        outline: 2px dashed #4CAF50 !important;
        outline-offset: 2px !important;
      }
      .testcaptive-recordable:hover {
        outline: 2px solid #4CAF50 !important;
        background-color: rgba(76, 175, 80, 0.1) !important;
      }
    `;
    document.head?.appendChild(style);

    const selector = 'button, input, select, textarea, a[href], [onclick], [role="button"], [tabindex], [draggable="true"], [contenteditable="true"]';
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('testcaptive-recordable');
    });

    console.log('✨ Interactive elements highlighted');
  }

  function removeHighlights(): void {
    const style = document.getElementById('testcaptive-highlight-style');
    if (style) style.remove();

    document.querySelectorAll('.testcaptive-recordable').forEach(el => {
      el.classList.remove('testcaptive-recordable');
    });
  }

  // ===== Assertion Functions =====

  function captureRightClick(event: MouseEvent): void {
    if (!isRecording) return;
    rightClickedElement = event.target as Element;
  }

  function createTextAssertion(assertionType: string, element: Element): void {
    const elementInfo = getElementInfo(element);
    let expectedValue = '';

    if (assertionType === 'assert-text-equals' || assertionType === 'assert-text-contains') {
      expectedValue = prompt(
        `Enter expected text for ${assertionType}:`,
        (element as HTMLElement).textContent?.trim() || ''
      ) || '';
      if (!expectedValue) return; // User cancelled
    } else if (assertionType === 'assert-url-contains') {
      expectedValue = prompt('Enter expected URL part:', window.location.pathname) || '';
      if (!expectedValue) return;
    }

    const assertion = {
      type: assertionType.replace('assert-', ''),
      description: getAssertionDescription(assertionType, expectedValue, elementInfo),
      expectedValue,
      timestamp: new Date().toISOString(),
      element: elementInfo
    };

    addAssertion(assertion);
  }

  function createSimpleAssertion(assertionType: string, element: Element): void {
    const elementInfo = getElementInfo(element);

    const assertion = {
      type: assertionType.replace('assert-', ''),
      description: getAssertionDescription(assertionType, null, elementInfo),
      timestamp: new Date().toISOString(),
      element: elementInfo
    };

    addAssertion(assertion);
  }

  function getAssertionDescription(
    type: string,
    value: string | null,
    elementInfo: ElementInfo
  ): string {
    const elementDesc = elementInfo.testid
      ? `[testid="${elementInfo.testid}"]`
      : elementInfo.id
      ? `#${elementInfo.id}`
      : elementInfo.text
      ? `"${elementInfo.text.substring(0, 30)}"`
      : elementInfo.tag;

    switch (type) {
      case 'assert-text-equals':
        return `Assert ${elementDesc} text equals "${value}"`;
      case 'assert-text-contains':
        return `Assert ${elementDesc} text contains "${value}"`;
      case 'assert-visible':
        return `Assert ${elementDesc} is visible`;
      case 'assert-not-visible':
        return `Assert ${elementDesc} is not visible`;
      case 'assert-enabled':
        return `Assert ${elementDesc} is enabled`;
      case 'assert-disabled':
        return `Assert ${elementDesc} is disabled`;
      case 'assert-url-contains':
        return `Assert URL contains "${value}"`;
      default:
        return `Assert ${type}`;
    }
  }

  function addAssertion(assertion: any): void {
    if (!isRecording || !sessionId) return;

    const assertionEvent: RecordedEvent = {
      type: 'assertion',
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      assertion,
      element: assertion.element || {
        tag: 'assertion', id: '', className: '', text: '', value: '',
        type: '', name: '', placeholder: '', testid: '', ariaLabel: '',
        role: '', xpath: ''
      },
      page: {
        url: window.location.href,
        title: document.title
      }
    };

    emitEvent(assertionEvent);
    console.log('✅ Assertion added:', assertion.type);

    // Visual feedback
    showAssertionFeedback(assertion.description);
  }

  function showAssertionFeedback(description: string): void {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: Arial, sans-serif;
      font-size: 14px;
      transition: opacity 0.5s;
    `;
    feedback.textContent = `✅ ${description}`;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => feedback.remove(), 500);
    }, 2500);
  }

  console.log('TestCaptive: Content script ready (enterprise mode)');
})();
