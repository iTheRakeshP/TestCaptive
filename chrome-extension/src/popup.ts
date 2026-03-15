// TestCaptive Enterprise Popup Script
// Controls recording start/stop and displays status

console.log('TestCaptive: Popup loaded');

let isRecording = false;

// DOM Elements
const elements = {
  startBtn: document.getElementById('startBtn') as HTMLButtonElement,
  stopBtn: document.getElementById('stopBtn') as HTMLButtonElement,
  recordingStatus: document.getElementById('recordingStatus') as HTMLElement,
  recordingText: document.getElementById('recordingText') as HTMLElement,
  eventCount: document.getElementById('eventCount') as HTMLElement,
};

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  refreshStatus();
});

function setupEventListeners(): void {
  elements.startBtn?.addEventListener('click', startRecording);
  elements.stopBtn?.addEventListener('click', stopRecording);
}

async function refreshStatus(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'get-status' });
    updateUI(response);
  } catch (error) {
    console.error('Failed to refresh status:', error);
    // Show disconnected state
    updateUI({ isRecording: false, eventCount: 0, sessionId: null });
  }
}

function updateUI(status: { isRecording: boolean; eventCount: number; sessionId: string | null }): void {
  isRecording = status.isRecording || false;

  if (isRecording) {
    if (elements.recordingStatus) elements.recordingStatus.className = 'status-indicator recording';
    if (elements.recordingText) elements.recordingText.textContent = 'Recording';
    if (elements.startBtn) elements.startBtn.disabled = true;
    if (elements.stopBtn) elements.stopBtn.disabled = false;
    if (elements.eventCount) elements.eventCount.textContent = `${status.eventCount} events`;
  } else {
    if (elements.recordingStatus) elements.recordingStatus.className = 'status-indicator disconnected';
    if (elements.recordingText) elements.recordingText.textContent = 'Stopped';
    if (elements.startBtn) elements.startBtn.disabled = false;
    if (elements.stopBtn) elements.stopBtn.disabled = true;
  }
}

async function startRecording(): Promise<void> {
  try {
    if (elements.startBtn) elements.startBtn.disabled = true;
    const response = await chrome.runtime.sendMessage({ type: 'start-recording' });
    if (response.success) {
      updateUI({ isRecording: true, eventCount: 0, sessionId: response.sessionId });
      window.close(); // Close popup to let user interact
    }
  } catch (error) {
    console.error('Error starting recording:', error);
    if (elements.startBtn) elements.startBtn.disabled = false;
  }
}

async function stopRecording(): Promise<void> {
  try {
    if (elements.stopBtn) elements.stopBtn.disabled = true;
    const response = await chrome.runtime.sendMessage({ type: 'stop-recording' });

    if (response.success) {
      updateUI({ isRecording: false, eventCount: 0, sessionId: null });
      downloadSession(response.events, response.sessionId);
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
    if (elements.stopBtn) elements.stopBtn.disabled = false;
  }
}

function downloadSession(events: any[], sessionId: string): void {
  // Collect browser metadata
  const metadata = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    viewportWidth: window.screen.availWidth,
    viewportHeight: window.screen.availHeight,
    devicePixelRatio: window.devicePixelRatio,
  };

  const sessionData = {
    id: sessionId,
    timestamp: new Date().toISOString(),
    events,
    framework: 'playwright',
    metadata
  };

  const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url,
    filename: `testcaptive-${sessionId}.json`,
    saveAs: true
  });
}

console.log('TestCaptive: Popup ready');
