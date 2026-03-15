// TestCaptive Enterprise Background Service Worker
// Manages recording state, stores events, handles context menus for assertions

console.log('TestCaptive: Background script starting (enterprise mode)...');

// ===== Core State =====
let isRecording = false;
let currentSessionId: string | null = null;
let recordedEvents: any[] = [];

const MAX_EVENTS = 10000; // Memory safety limit

// ===== Message Listener =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('TestCaptive: Message received:', message.type);

  switch (message.type) {
    case 'ping':
      sendResponse({
        success: true,
        message: 'pong from TestCaptive',
        isRecording
      });
      break;

    case 'start-recording':
      isRecording = true;
      currentSessionId = 'session_' + Date.now();
      recordedEvents = [];
      console.log('🔴 Recording started:', currentSessionId);

      // Capture initial URL as navigation event
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.url) {
          recordedEvents.push({
            type: 'navigation',
            timestamp: new Date().toISOString(),
            page: {
              url: activeTab.url,
              title: activeTab.title || ''
            },
            element: {
              tag: 'window', id: '', className: '', text: '', value: '',
              type: '', name: '', placeholder: '', testid: '', ariaLabel: '',
              role: '', xpath: ''
            },
            sessionId: currentSessionId
          });
        }

        // Notify content script
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, {
            type: 'start-recording',
            sessionId: currentSessionId
          }).catch(() => { /* content script may not be ready */ });
        }
      });

      sendResponse({ success: true, sessionId: currentSessionId });
      break;

    case 'stop-recording':
      isRecording = false;
      console.log('⏹️ Recording stopped. Total events:', recordedEvents.length);

      // Notify content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'stop-recording' }).catch(() => {});
        }
      });

      sendResponse({
        success: true,
        events: recordedEvents,
        sessionId: currentSessionId
      });
      break;

    case 'event-captured':
      if (isRecording && recordedEvents.length < MAX_EVENTS) {
        recordedEvents.push(message.data);
        console.log('📥 Event stored. Total:', recordedEvents.length);
      } else if (recordedEvents.length >= MAX_EVENTS) {
        console.warn('⚠️ Max events reached, ignoring new events');
      }
      break;

    case 'get-status':
      sendResponse({
        isRecording,
        eventCount: recordedEvents.length,
        sessionId: currentSessionId
      });
      break;
  }
  return true; // Keep channel open for async response
});

// ===== Tab Navigation Tracking =====
// Capture tab URL changes for multi-page navigation tracking
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isRecording || !currentSessionId) return;
  if (changeInfo.status !== 'complete' || !tab.url) return;

  // Only track the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id !== tabId) return;

    // Avoid duplicating navigations already captured by content script
    const lastEvent = recordedEvents[recordedEvents.length - 1];
    if (lastEvent?.type === 'navigation' && lastEvent?.page?.url === tab.url) return;

    recordedEvents.push({
      type: 'navigation',
      timestamp: new Date().toISOString(),
      page: {
        url: tab.url,
        title: tab.title || ''
      },
      element: {
        tag: 'window', id: '', className: '', text: '', value: '',
        type: '', name: '', placeholder: '', testid: '', ariaLabel: '',
        role: '', xpath: ''
      },
      sessionId: currentSessionId
    });

    console.log('🧭 Tab navigation captured:', tab.url);

    // Re-inject content script into the new page
    chrome.tabs.sendMessage(tabId, {
      type: 'start-recording',
      sessionId: currentSessionId
    }).catch(() => {
      // Content script not loaded on new page, inject it
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      }).then(() => {
        // After injection, start recording
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            type: 'start-recording',
            sessionId: currentSessionId
          }).catch(() => {});
        }, 200);
      }).catch(() => {});
    });
  });
});

// ===== Context Menu for Assertions =====
chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu
  chrome.contextMenus.create({
    id: 'testcaptive-assertions',
    title: '✅ TestCaptive Assertions',
    contexts: ['all']
  });

  // Text-based assertions
  chrome.contextMenus.create({
    id: 'assert-text-equals',
    parentId: 'testcaptive-assertions',
    title: 'Assert Text Equals...',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: 'assert-text-contains',
    parentId: 'testcaptive-assertions',
    title: 'Assert Text Contains...',
    contexts: ['all']
  });

  // Visibility assertions
  chrome.contextMenus.create({
    id: 'assert-visible',
    parentId: 'testcaptive-assertions',
    title: 'Assert Element Visible',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: 'assert-not-visible',
    parentId: 'testcaptive-assertions',
    title: 'Assert Element Not Visible',
    contexts: ['all']
  });

  // State assertions
  chrome.contextMenus.create({
    id: 'assert-enabled',
    parentId: 'testcaptive-assertions',
    title: 'Assert Element Enabled',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: 'assert-disabled',
    parentId: 'testcaptive-assertions',
    title: 'Assert Element Disabled',
    contexts: ['all']
  });

  // URL assertions
  chrome.contextMenus.create({
    id: 'assert-url-contains',
    parentId: 'testcaptive-assertions',
    title: 'Assert URL Contains...',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: 'assert-url-equals',
    parentId: 'testcaptive-assertions',
    title: 'Assert URL Equals...',
    contexts: ['all']
  });

  // Attribute assertions
  chrome.contextMenus.create({
    id: 'assert-attribute-equals',
    parentId: 'testcaptive-assertions',
    title: 'Assert Attribute Equals...',
    contexts: ['all']
  });

  console.log('✅ Context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!isRecording || !tab?.id) {
    console.log('⚠️ Cannot add assertion: Not recording');
    return;
  }

  const assertionType = info.menuItemId as string;

  // Text-based assertions that need a prompt
  if (assertionType === 'assert-text-equals' ||
      assertionType === 'assert-text-contains' ||
      assertionType === 'assert-url-contains' ||
      assertionType === 'assert-url-equals' ||
      assertionType === 'assert-attribute-equals') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'create-text-assertion',
      assertionType
    }).catch(() => {});
  } else {
    // Simple assertions
    chrome.tabs.sendMessage(tab.id, {
      type: 'create-simple-assertion',
      assertionType
    }).catch(() => {});
  }
});
