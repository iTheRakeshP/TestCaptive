// TestCaptive Enterprise Background Service Worker
// Manages recording state, stores events, handles context menus for assertions

console.log('TestCaptive: Background script starting (enterprise mode)...');

// ===== Core State =====
let isRecording = false;
let currentSessionId: string | null = null;
let recordedEvents: any[] = [];
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const MAX_EVENTS = 10000; // Memory safety limit
const PERSIST_DEBOUNCE_MS = 500; // Debounce writes to storage

// ===== Persistence Layer =====
// Survives service worker termination (MV3 can kill after ~5 min idle)
function persistState() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    chrome.storage.local.set({
      'tc_isRecording': isRecording,
      'tc_sessionId': currentSessionId,
      'tc_events': recordedEvents
    });
  }, PERSIST_DEBOUNCE_MS);
}

function persistStateImmediate() {
  if (persistTimer) clearTimeout(persistTimer);
  chrome.storage.local.set({
    'tc_isRecording': isRecording,
    'tc_sessionId': currentSessionId,
    'tc_events': recordedEvents
  });
}

function clearPersistedState() {
  if (persistTimer) clearTimeout(persistTimer);
  chrome.storage.local.remove(['tc_isRecording', 'tc_sessionId', 'tc_events']);
}

// Restore state on service worker wake-up
async function restoreState() {
  try {
    const data = await chrome.storage.local.get(['tc_isRecording', 'tc_sessionId', 'tc_events']);
    if (data.tc_isRecording) {
      isRecording = true;
      currentSessionId = (data.tc_sessionId as string) || null;
      recordedEvents = (data.tc_events as any[]) || [];
      console.log('♻️ Restored recording state:', recordedEvents.length, 'events');
    }
  } catch (e) {
    console.warn('Failed to restore state:', e);
  }
}

// Restore immediately on load
restoreState();

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
      persistStateImmediate();

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
      clearPersistedState();

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
        persistState();
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

// ===== Multi-Tab / Popup Window Tracking =====
// Detect new tabs/popups opened during recording and inject content script
chrome.tabs.onCreated.addListener((tab) => {
  if (!isRecording || !currentSessionId) return;

  const newTabId = tab.id;
  if (!newTabId) return;

  // Record a new-tab event
  recordedEvents.push({
    type: 'new-tab',
    timestamp: new Date().toISOString(),
    page: {
      url: tab.pendingUrl || tab.url || 'about:blank',
      title: ''
    },
    element: {
      tag: 'window', id: '', className: '', text: '', value: '',
      type: '', name: '', placeholder: '', testid: '', ariaLabel: '',
      role: '', xpath: ''
    },
    sessionId: currentSessionId,
    tabId: newTabId,
    windowId: tab.windowId
  });

  console.log('🆕 New tab detected:', tab.pendingUrl || tab.url);
  persistState();

  // Wait for the tab to finish loading, then inject content script
  const onTabReady = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    if (tabId !== newTabId || changeInfo.status !== 'complete') return;
    chrome.tabs.onUpdated.removeListener(onTabReady);

    chrome.scripting.executeScript({
      target: { tabId: newTabId },
      files: ['content.js']
    }).then(() => {
      setTimeout(() => {
        chrome.tabs.sendMessage(newTabId, {
          type: 'start-recording',
          sessionId: currentSessionId
        }).catch(() => {});
      }, 200);
    }).catch(() => {});
  };

  chrome.tabs.onUpdated.addListener(onTabReady);
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
