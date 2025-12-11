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
