console.log('TestCaptive: Background script starting...');

// Core state
<<<<<<< HEAD
let isRecording = false;
let currentSessionId = null;
let recordedEvents = [];
=======
let ws = null;
let currentSession = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// WebSocket connection to bridge server
function connectToWebSocket() {
  try {
    ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('TestCaptive: Connected to bridge server');
      reconnectAttempts = 0;
      
      // Register as chrome extension
      ws.send(JSON.stringify({
        type: 'register',
        clientType: 'chrome-extension'
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket closed');
      attemptReconnect();
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
  } catch (error) {
    console.error('❌ Failed to connect to WebSocket:', error);
    attemptReconnect();
  }
}

function attemptReconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
    setTimeout(() => {
      connectToWebSocket();
    }, 2000 * reconnectAttempts);
  }
}

function handleWebSocketMessage(message) {
  console.log('TestCaptive: Received WebSocket message:', message.type, message);
  
  switch (message.type) {
    case 'registration-success':
      console.log('Successfully registered with bridge server');
      break;
    case 'session-start':      console.log('TestCaptive: Session start request from VSCode:', message);
      console.log('TestCaptive: Checking auto-launch conditions:', {
        hasUrl: !!message.url,
        autoLaunch: message.autoLaunch,
        url: message.url
      });
      if (message.url && message.autoLaunch) {        console.log('TestCaptive: Auto-launching session...');
        handleAutoLaunchSession(message.sessionId, message.url);
      } else {
        console.log('TestCaptive: Auto-launch conditions not met');
      }
      break;
    case 'session-started':
      console.log('Session started by VS Code extension');
      break;
    case 'session-ended':
      console.log('Session ended by VS Code extension');
      if (currentSession) {
        currentSession = null;
      }
      break;
    default:
      console.log('Message from bridge:', message);
  }
}

function sendWebSocketMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket not connected, cannot send message');
  }
}
>>>>>>> b88ef7ee0f23a8ca3beb23b4963704be4293f3aa

// Message listener for extension communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('TestCaptive: Message received:', message.type);
  
<<<<<<< HEAD
  switch (message.type) {
=======
  switch (message.type) {    case 'ping':
      sendResponse({
        success: true,
        message: 'pong from TestCaptive',
        wsConnected: ws?.readyState === WebSocket.OPEN,
        sessionActive: !!currentSession
      });
      break;
    
    case 'test-tab-creation':
      // Test function to verify tab creation works
      console.log('🧪 Testing tab creation...');
      chrome.tabs.create({
        url: message.url || 'https://www.google.com',
        active: true
      }).then(tab => {
        console.log('✅ Test tab created successfully:', tab.id);
        sendResponse({ success: true, tabId: tab.id });
      }).catch(error => {
        console.error('❌ Test tab creation failed:', error);
        sendResponse({ success: false, error: error.message });
      });
      break;
      
>>>>>>> b88ef7ee0f23a8ca3beb23b4963704be4293f3aa
    case 'start-recording':
      isRecording = true;
      currentSessionId = `session_${Date.now()}`;
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

<<<<<<< HEAD
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, { 
=======
// Auto-launch session when requested by VSCode
async function handleAutoLaunchSession(sessionId, url) {
  console.log('TestCaptive: handleAutoLaunchSession called with:', { sessionId, url });
  
  try {    console.log('TestCaptive: Attempting to create new tab with URL:', url);
    
    // Test basic tab creation permissions first
    const permissions = await chrome.permissions.contains({
      permissions: ['tabs']
    });
    console.log('TestCaptive: Tab permissions:', permissions);
    
    // Create or activate a tab with the target URL
    const tab = await chrome.tabs.create({
      url: url,
      active: true
    });
    
    console.log('TestCaptive: Successfully created new tab:', tab.id, 'for URL:', url);
    
    // Start session
    currentSession = {
      id: sessionId,
      startTime: new Date().toISOString(),
      events: [],
      isActive: true,
      url: url,
      tabId: tab.id
    };
    
    // Notify bridge server that session started
    sendWebSocketMessage({
      type: 'session-started',
      clientType: 'chrome-extension',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      url: url
    });
    
    // Wait for tab to load, then start capturing
    chrome.tabs.onUpdated.addListener(function tabLoadListener(tabId, info, tab) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(tabLoadListener);
        
        // Send navigation event
        const navigationEvent = {
          type: 'navigation',
          url: url,
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
          element: {
            tag: 'window',
            text: tab.title || '',
          },
          page: {
            url: tab.url || url,
            title: tab.title || ''
          }
        };
        
        forwardEventToWebSocket(navigationEvent);
        
        // Start recording on the tab
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            type: 'start-recording',
            sessionId: sessionId
          }).catch(error => {
            console.warn('Could not send start-recording message to tab:', error);
          });
        }, 1000);
      }
    });
    
  } catch (error) {
    console.error('❌ Error in auto-launch:', error);
    sendWebSocketMessage({
      type: 'session-error',
      clientType: 'chrome-extension',
      sessionId: sessionId,
      error: error.message
    });
  }
}

// Recording functions
async function startRecording() {
  if (currentSession) {
    throw new Error('Recording already in progress');
  }
  
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  currentSession = {
    id: sessionId,
    startTime: new Date().toISOString(),
    events: [],
    isActive: true
  };
  
  // Notify bridge server
  sendWebSocketMessage({
    type: 'session-start',
    clientType: 'chrome-extension',
    sessionId: sessionId,
    timestamp: new Date().toISOString()
  });
  
  // Notify all tabs to start recording
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
>>>>>>> b88ef7ee0f23a8ca3beb23b4963704be4293f3aa
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
