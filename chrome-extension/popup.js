console.log('TestCaptive: Popup loaded');

let isRecording = false;

// DOM Elements
const elements = {
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    recordingStatus: document.getElementById('recordingStatus'),
    recordingText: document.getElementById('recordingText'),
    eventCount: document.getElementById('eventCount')
};

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    refreshStatus();
});

function setupEventListeners() {
    elements.startBtn.addEventListener('click', startRecording);
    elements.stopBtn.addEventListener('click', stopRecording);
}

async function refreshStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'get-status' });
        updateUI(response);
    } catch (error) {
        console.error('Failed to refresh status:', error);
    }
}

function updateUI(status) {
    isRecording = status.isRecording || false;
    
    if (isRecording) {
        elements.recordingStatus.className = 'status-indicator recording';
        elements.recordingText.textContent = 'Recording';
        elements.startBtn.disabled = true;
        elements.stopBtn.disabled = false;
        if (elements.eventCount) elements.eventCount.textContent = `${status.eventCount} events`;
    } else {
        elements.recordingStatus.className = 'status-indicator disconnected';
        elements.recordingText.textContent = 'Stopped';
        elements.startBtn.disabled = false;
        elements.stopBtn.disabled = true;
    }
}

async function startRecording() {
    try {
        elements.startBtn.disabled = true;
        const response = await chrome.runtime.sendMessage({ type: 'start-recording' });
        if (response.success) {
            updateUI({ isRecording: true, eventCount: 0 });
            window.close(); // Close popup to let user interact
        }
    } catch (error) {
        console.error('Error starting recording:', error);
        elements.startBtn.disabled = false;
    }
}

async function stopRecording() {
    try {
        elements.stopBtn.disabled = true;
        const response = await chrome.runtime.sendMessage({ type: 'stop-recording' });
        
        if (response.success) {
            updateUI({ isRecording: false });
            downloadSession(response.events, response.sessionId);
        }
    } catch (error) {
        console.error('Error stopping recording:', error);
        elements.stopBtn.disabled = false;
    }
}

function downloadSession(events, sessionId) {
    const sessionData = {
        id: sessionId,
        timestamp: new Date().toISOString(),
        events: events,
        framework: 'playwright' // Default, can be changed in VS Code
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
        url: url,
        filename: `testcaptive-${sessionId}.json`,
        saveAs: true
    });
}
<<<<<<< HEAD
=======

function logMessage(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        info: '#e0e0e0',
        success: '#4CAF50',
        error: '#f44336'
    };
    
    const color = colors[type] || colors.info;
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    elements.log.innerHTML = 
        `<div style="color: ${color}; margin-bottom: 4px;">[${timestamp}] ${prefix} ${message}</div>` + 
        elements.log.innerHTML;
    
    // Keep log manageable
    const logs = elements.log.children;
    if (logs.length > 10) {
        logs[logs.length - 1].remove();
    }
}

console.log('TestCaptive: Popup ready');
>>>>>>> b88ef7ee0f23a8ca3beb23b4963704be4293f3aa
