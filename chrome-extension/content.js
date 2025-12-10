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
    
    // Debounce variables for input events
    let inputDebounceTimer = null;
    let pendingInputEvent = null;

    // Event coalescing variables
    let eventQueue = [];
    let coalescingTimer = null;

    function flushPendingInput() {
        if (pendingInputEvent) {
            // Before sending the input event, check if there's a recent click event in the queue
            // for the same element and remove it (click + input merge)
            const recentClickIndex = eventQueue.findIndex(e => 
                e.type === 'click' && 
                isSameElement(e, pendingInputEvent) &&
                timeDiff(e, pendingInputEvent) < 300
            );
            
            if (recentClickIndex !== -1) {
                // Remove the click event from the queue
                eventQueue.splice(recentClickIndex, 1);
            }
            
            sendEvent(pendingInputEvent);
            pendingInputEvent = null;
            if (inputDebounceTimer) {
                clearTimeout(inputDebounceTimer);
                inputDebounceTimer = null;
            }
        }
    }

    // Helper function to check if two events target the same element
    function isSameElement(event1, event2) {
        const id1 = event1.selector || (event1.element && event1.element.xpath) || (event1.element && event1.element.id);
        const id2 = event2.selector || (event2.element && event2.element.xpath) || (event2.element && event2.element.id);
        return id1 && id2 && id1 === id2;
    }

    // Helper function to calculate time difference in milliseconds
    function timeDiff(event1, event2) {
        return new Date(event2.timestamp).getTime() - new Date(event1.timestamp).getTime();
    }

    // Smart event coalescing function
    function coalesceEvents() {
        if (eventQueue.length === 0) return;
        
        const processed = [];
        
        for (let i = 0; i < eventQueue.length; i++) {
            const current = eventQueue[i];
            const next = eventQueue[i + 1];
            
            // Skip focus if followed by click on same element (within 200ms)
            if (current.type === 'focus' && next && next.type === 'click' &&
                isSameElement(current, next) && 
                timeDiff(current, next) < 200) {
                continue; // Skip this focus event
            }
            
            processed.push(current);
        }
        
        // Send processed events
        processed.forEach(event => sendEvent(event));
        eventQueue = [];
    }

    function sendEvent(eventData) {
        // Remove internal properties before sending
        const dataToSend = { ...eventData };
        delete dataToSend._targetElement;

        recordedEvents.push(dataToSend);
        
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
                
                // Flush event queue
                if (coalescingTimer) {
                    clearTimeout(coalescingTimer);
                    coalescingTimer = null;
                }
                coalesceEvents(); // Flush any remaining events in the queue
                
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
            
            // Handle keydown events - only capture meaningful keys
            if (event.type === 'keydown') {
                const meaningfulKeys = ['Enter', 'Tab', 'Escape', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
                if (!meaningfulKeys.includes(event.key)) {
                    return; // Ignore other keys (regular typing)
                }
                eventData.key = event.key;
                eventData.keyCode = event.keyCode;
                eventData.inputValue = event.key; // Store key as value for template usage
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
                inputDebounceTimer = setTimeout(flushPendingInput, 500); // 500ms debounce
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

            // Add to event queue for coalescing (focus, blur, click)
            if (['focus', 'click', 'blur'].includes(event.type)) {
                eventQueue.push(eventData);
                
                clearTimeout(coalescingTimer);
                coalescingTimer = setTimeout(coalesceEvents, 100); // 100ms coalescing window
                return;
            }

            // Send immediately for other event types (navigation, submit, change on select/checkbox, keydown)
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
    const eventTypes = ['click', 'input', 'change', 'submit', 'focus', 'blur', 'keydown'];
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
    
    console.log('TestCaptive: Content script ready');
    
})();
