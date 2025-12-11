// TestCaptive Production Content Script
(function() {
    'use strict';
    
    // Prevent multiple loads
    if (window.__TESTCAPTIVE_LOADED__) {
        return;
    }
    window.__TESTCAPTIVE_LOADED__ = true;
    
    console.log('🎯 TestCaptive Content Script Loaded');
    
    // Set detection flag immediately and persistently
    function setDetectionFlag() {
        window.testCaptiveContentScript = true;
        
        // Also set on document
        if (document) {
            document.testCaptiveContentScript = true;
        }
        
        // Set in sessionStorage as backup
        try {
            sessionStorage.setItem('testCaptiveActive', 'true');
        } catch (e) {}
        
        // Create hidden DOM element as another backup
        try {
            if (!document.getElementById('__testcaptive_flag__')) {
                const flag = document.createElement('meta');
                flag.id = '__testcaptive_flag__';
                flag.name = 'testcaptive-detected';
                flag.content = 'true';
                flag.style.display = 'none';
                
                if (document.head) {
                    document.head.appendChild(flag);
                } else if (document.documentElement) {
                    document.documentElement.appendChild(flag);
                }
            }
        } catch (e) {}
        
        console.log('🎯 Detection flag set:', window.testCaptiveContentScript);
    }
    
    // Set flag immediately
    setDetectionFlag();
    
    // Keep setting it to prevent clearing
    setInterval(setDetectionFlag, 1000);
    
    // Also set when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setDetectionFlag);
    } else {
        setDetectionFlag();
    }
    
    // Set after window load too
    window.addEventListener('load', setDetectionFlag);
    
    // ...existing code...
    
    // Recording state
    let isRecording = false;
    let sessionId = null;
    let recordedEvents = [];
    let rightClickedElement = null; // Store element for context menu assertions
    
    // Enhanced debounce variables
    let inputDebounceTimer = null;
    let pendingInputEvent = null;
    let lastCapturedEvent = null;
    let lastEventTimestamp = 0;
    
    // Event deduplication settings
    const DEBOUNCE_DELAY = 500; // ms for input events
    const MIN_EVENT_INTERVAL = 100; // ms minimum between similar events

    function flushPendingInput() {
        if (pendingInputEvent) {
            sendEvent(pendingInputEvent);
            pendingInputEvent = null;
            if (inputDebounceTimer) {
                clearTimeout(inputDebounceTimer);
                inputDebounceTimer = null;
            }
        }
    }
    
    // Check if event should be captured (debounce duplicate events)
    function shouldCaptureEvent(eventData) {
        const now = Date.now();
        
        // Always capture navigation events
        if (eventData.type === 'navigation') {
            return true;
        }
        
        // Check if we recently captured a similar event
        if (lastCapturedEvent) {
            const timeDiff = now - lastEventTimestamp;
            const isSameElement = lastCapturedEvent.selector === eventData.selector;
            const isSameType = lastCapturedEvent.type === eventData.type;
            
            // Skip duplicate events that happen too quickly on the same element
            if (isSameElement && isSameType && timeDiff < MIN_EVENT_INTERVAL) {
                console.log(`⏭️ Skipping duplicate ${eventData.type} on ${eventData.selector}`);
                return false;
            }
            
            // Skip redundant focus/blur events after a click on the same element
            if (isSameElement && timeDiff < MIN_EVENT_INTERVAL) {
                if ((lastCapturedEvent.type === 'click' && eventData.type === 'focus') ||
                    (lastCapturedEvent.type === 'focus' && eventData.type === 'blur' && timeDiff < 200)) {
                    console.log(`⏭️ Skipping redundant ${eventData.type} after ${lastCapturedEvent.type}`);
                    return false;
                }
            }
        }
        
        return true;
    }

    function sendEvent(eventData) {
        // Remove internal properties before sending
        const dataToSend = { ...eventData };
        delete dataToSend._targetElement;

        recordedEvents.push(dataToSend);
        
        // Update last captured event for debouncing
        lastCapturedEvent = {
            type: dataToSend.type,
            selector: dataToSend.selector
        };
        lastEventTimestamp = Date.now();
        
        // Send to background script
        chrome.runtime.sendMessage({
            type: 'event-captured',
            data: dataToSend
        });
        
        console.log('📤 Event captured:', dataToSend.type, dataToSend.element.tag);
    }
    
    // Listen for messages from extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case 'start-recording':
                startRecording(message.sessionId);
                sendResponse({ success: true });
                break;
                
            case 'stop-recording':
                flushPendingInput(); // Flush any pending input before stopping
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
    
    // Start recording function
    function startRecording(newSessionId) {
        isRecording = true;
        sessionId = newSessionId;
        recordedEvents = [];
        
        // Reset debounce state
        lastCapturedEvent = null;
        lastEventTimestamp = 0;
        pendingInputEvent = null;
        if (inputDebounceTimer) {
            clearTimeout(inputDebounceTimer);
            inputDebounceTimer = null;
        }
        
        attachEventListeners();
        highlightRecordableElements();
        console.log('🔴 Recording started:', sessionId);
    }
    
    // Stop recording function
    function stopRecording() {
        isRecording = false;
        const eventCount = recordedEvents.length;
        removeEventListeners();
        removeHighlights();
        console.log('⏹️ Recording stopped. Events captured:', eventCount);
        sessionId = null;
        recordedEvents = [];
        return eventCount;
    }
    
    // Event capture function
    function captureEvent(event) {
        if (!isRecording || !sessionId) return;
        
        // Flush pending input if this is a different event type or different element
        if (pendingInputEvent && (event.type !== 'input' || event.target !== pendingInputEvent._targetElement)) {
             flushPendingInput();
        }

        try {
            const element = event.target;
            const rect = element.getBoundingClientRect();
            
            const eventData = {
                type: event.type,
                timestamp: new Date().toISOString(),
                element: {
                    tag: element.tagName?.toLowerCase() || '',
                    id: element.id || '',
                    className: element.className || '',
                    text: element.textContent?.substring(0, 100) || '',
                    value: element.value || '',
                    type: element.type || '',
                    name: element.name || '',
                    placeholder: element.placeholder || '',
                    testid: element.getAttribute('data-testid') || element.getAttribute('data-test-id') || '',
                    ariaLabel: element.getAttribute('aria-label') || '',
                    role: element.getAttribute('role') || '',
                    xpath: generateXPath(element)
                },
                position: {
                    x: Math.round(rect.left + window.scrollX),
                    y: Math.round(rect.top + window.scrollY),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                },
                page: {
                    url: window.location.href,
                    title: document.title,
                    scrollX: window.scrollX,
                    scrollY: window.scrollY
                },
                sessionId: sessionId,
                selector: generateSelector(element)
            };
            
            // Add event-specific data
            if (event.type === 'input' || event.type === 'change') {
                eventData.inputValue = element.value;
            }
            
            if (event.type === 'click') {
                eventData.clickPosition = {
                    clientX: event.clientX,
                    clientY: event.clientY
                };
            }
            
            // Handle Input Debouncing
            if (event.type === 'input') {
                // Ignore input events for SELECT, CHECKBOX, RADIO elements (rely on change event)
                if (element.tagName === 'SELECT' || element.type === 'checkbox' || element.type === 'radio') {
                    return;
                }

                // Store reference to target for comparison
                eventData._targetElement = element; 
                pendingInputEvent = eventData;
                
                if (inputDebounceTimer) clearTimeout(inputDebounceTimer);
                inputDebounceTimer = setTimeout(flushPendingInput, DEBOUNCE_DELAY);
                return;
            }

            // Ignore 'change' events for text inputs/textareas as they are covered by 'input'
            if (event.type === 'change' && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
                // Only ignore if it's a text type input or textarea
                const type = element.type;
                if (!type || type === 'text' || type === 'password' || type === 'email' || type === 'search' || type === 'tel' || type === 'url' || type === 'textarea') {
                    return;
                }
            }

            // Check if event should be captured (prevent duplicates)
            if (!shouldCaptureEvent(eventData)) {
                return;
            }

            sendEvent(eventData);
            
        } catch (error) {
            console.error('Error capturing event:', error);
        }
    }
    
    // Generate CSS selector for element
    function generateSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }

        // Prioritize data-testid
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test-id');
        if (testId) {
            return `[data-testid="${testId}"]`;
        }

        // Prioritize aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
            return `[aria-label="${ariaLabel}"]`;
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
                selector += '.' + classes.slice(0, 2).join('.');
            }
        }
        
        // Add nth-child if needed for uniqueness
        const parent = element.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(element) + 1;
                selector += `:nth-child(${index})`;
            }
        }
        
        return selector;
    }

    // Generate XPath for element
    function generateXPath(element) {
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        if (element === document.body) {
            return '/html/body';
        }
        
        let ix = 0;
        const siblings = element.parentNode ? element.parentNode.childNodes : [];
        
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
                const parentXPath = element.parentNode ? generateXPath(element.parentNode) : '';
                return parentXPath + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                ix++;
            }
        }
        return '';
    }
    
    // Event listeners for UI interactions
    const eventTypes = ['click', 'input', 'change', 'submit', 'focus', 'blur'];
    const eventHandlers = {};
    
    function attachEventListeners() {
        eventTypes.forEach(eventType => {
            eventHandlers[eventType] = (e) => captureEvent(e);
            document.addEventListener(eventType, eventHandlers[eventType], true);
        });
        console.log('🎯 Event listeners attached');
    }
    
    function removeEventListeners() {
        eventTypes.forEach(eventType => {
            if (eventHandlers[eventType]) {
                document.removeEventListener(eventType, eventHandlers[eventType], true);
            }
        });
        console.log('🎯 Event listeners removed');
    }
    
    // Visual highlighting for recordable elements
    function highlightRecordableElements() {
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
        document.head.appendChild(style);
        
        // Highlight interactive elements
        const selector = 'button, input, select, textarea, a[href], [onclick], [role="button"], [tabindex]';
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('testcaptive-recordable');
        });
        
        console.log('✨ Interactive elements highlighted');
    }
    
    function removeHighlights() {
        const style = document.getElementById('testcaptive-highlight-style');
        if (style) style.remove();
        
        document.querySelectorAll('.testcaptive-recordable').forEach(el => {
            el.classList.remove('testcaptive-recordable');
        });
        
        console.log('✨ Highlights removed');
    }
    
    // Assertion functions
    function captureRightClick(event) {
        if (!isRecording) return;
        rightClickedElement = event.target;
    }
    
    function createTextAssertion(assertionType, element) {
        const elementInfo = getElementInfo(element);
        let expectedValue = '';
        
        if (assertionType === 'assert-text-equals' || assertionType === 'assert-text-contains') {
            expectedValue = prompt(`Enter expected text for ${assertionType}:`, element.textContent?.trim() || '');
            if (!expectedValue) return; // User cancelled
        } else if (assertionType === 'assert-url-contains') {
            expectedValue = prompt('Enter expected URL part:', window.location.pathname);
            if (!expectedValue) return;
        }
        
        const assertion = {
            type: assertionType.replace('assert-', ''),
            description: getAssertionDescription(assertionType, expectedValue, elementInfo),
            expectedValue: expectedValue,
            timestamp: new Date().toISOString(),
            element: elementInfo
        };
        
        addAssertion(assertion);
    }
    
    function createSimpleAssertion(assertionType, element) {
        const elementInfo = getElementInfo(element);
        
        const assertion = {
            type: assertionType.replace('assert-', ''),
            description: getAssertionDescription(assertionType, null, elementInfo),
            timestamp: new Date().toISOString(),
            element: elementInfo
        };
        
        addAssertion(assertion);
    }
    
    function getAssertionDescription(type, value, elementInfo) {
        const elementDesc = elementInfo.id ? `#${elementInfo.id}` : 
                           elementInfo.text ? `"${elementInfo.text.substring(0, 30)}"` : 
                           elementInfo.tag;
        
        switch(type) {
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
    
    function addAssertion(assertion) {
        const assertionEvent = {
            type: 'assertion',
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            assertion: assertion,
            page: {
                url: window.location.href,
                title: document.title
            }
        };
        
        sendEvent(assertionEvent);
        console.log('✅ Assertion added:', assertion.type);
        
        // Visual feedback
        showAssertionFeedback(assertion.description);
    }
    
    function showAssertionFeedback(description) {
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
        `;
        feedback.textContent = `✅ ${description}`;
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 3000);
    }
    
    function addAssertion(assertion) {
        const assertionEvent = {
            type: 'assertion',
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            assertion: assertion
        };
        
        sendEvent(assertionEvent);
        console.log('✅ Assertion added:', assertion.type);
    }
    
    // Attach contextmenu listener for right-click
    document.addEventListener('contextmenu', captureRightClick, true);
    
    console.log('TestCaptive: Content script ready');
    
})();
