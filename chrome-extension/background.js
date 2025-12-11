console.log('TestCaptive: Background script starting...');

// Core state
let isRecording = false;
let currentSessionId = null;
let recordedEvents = [];

// Message listener for extension communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('TestCaptive: Message received:', message.type);
  
  switch (message.type) {
    case 'ping':
      sendResponse({
        success: true,
        message: 'pong from TestCaptive',
        isRecording: isRecording
      });
      break;

    case 'start-recording':
      isRecording = true;
      currentSessionId = 'session_' + Date.now();
      recordedEvents = [];
      console.log('🔴 Recording started:', currentSessionId);
      
      // Capture initial URL as navigation event
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.url) {
            recordedEvents.push({
                type: 'navigation',
                timestamp: new Date().toISOString(),
                page: {
                    url: activeTab.url,
                    title: activeTab.title || ''
                },
                sessionId: currentSessionId
            });
        }

        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, { 
            type: 'start-recording',
            sessionId: currentSessionId 
          }).catch(() => {});
        }
      });
      
      sendResponse({ success: true, sessionId: currentSessionId });
      break;

    case 'stop-recording':
      isRecording = false;
      console.log('⏹️ Recording stopped. Total events:', recordedEvents.length);
      
      // Notify active tab content script
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
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
      if (isRecording) {
        recordedEvents.push(message.data);
        console.log('📥 Event stored. Total:', recordedEvents.length);
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

// Context menu for assertions
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
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!isRecording) {
    console.log('⚠️ Cannot add assertion: Not recording');
    return;
  }
  
  const assertionType = info.menuItemId;
  
  // For text-based assertions, we need a prompt
  if (assertionType === 'assert-text-equals' || 
      assertionType === 'assert-text-contains' || 
      assertionType === 'assert-url-contains') {
    
    // Send message to content script to get element info and show prompt
    chrome.tabs.sendMessage(tab.id, {
      type: 'create-text-assertion',
      assertionType: assertionType
    });
  } else {
    // For simple assertions, create immediately
    chrome.tabs.sendMessage(tab.id, {
      type: 'create-simple-assertion',
      assertionType: assertionType
    });
  }
});
