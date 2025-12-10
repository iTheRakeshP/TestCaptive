// Review panel webview provider for event review and test code generation
import * as vscode from 'vscode';
import { TestDataManager } from '../test-data-manager';
import { SessionData } from '../types';
import { CodeGenerator } from '../code-generator';

export class ReviewWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private testDataManager: TestDataManager;
    private codeGenerator: CodeGenerator;
    private currentSessionId: string | null = null;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        testDataManager: TestDataManager,
        codeGenerator: CodeGenerator
    ) {
        this.testDataManager = testDataManager;
        this.codeGenerator = codeGenerator;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'importSession':
                    this.importSession(data.jsonContent);
                    break;
                case 'generateCode':
                    await this.generateCode(data.framework);
                    break;
                case 'exportCode':
                    await this.exportCode(data.framework, data.code);
                    break;
                case 'exportTestData':
                    await this.exportTestData(data.data);
                    break;
            }
        });
    }

    private importSession(jsonContent: string): void {
        try {
            const sessionData = JSON.parse(jsonContent);
            const sessionId = this.testDataManager.importSessionData(sessionData);
            this.loadSessionData(sessionId);
            vscode.window.showInformationMessage(`Successfully imported session: ${sessionId}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to import session: ${error}`);
        }
    }

    public loadSessionData(sessionId: string): void {
        if (!this._view) return;
        
        this.currentSessionId = sessionId;
        let session = this.testDataManager.getSession(sessionId);
        
        if (session) {
            this._view.webview.postMessage({
                type: 'sessionLoaded',
                sessionId: session.id,
                events: session.events,
                testData: session.testData || {}
            });
        }
    }

    public loadMostRecentSession(): void {
        const session = this.testDataManager.getMostRecentSession();
        if (session) {
            this.loadSessionData(session.id);
        }
    }

    private async generateCode(framework: 'selenium' | 'playwright' | 'cypress'): Promise<void> {
        if (!this.currentSessionId) return;

        const session = this.testDataManager.getSession(this.currentSessionId);
        if (!session) return;

        try {
            session.framework = framework;
            this.testDataManager.updateSessionConfig(this.currentSessionId, { framework });

            const code = this.codeGenerator.generateTestCode(session);
            
            if (this._view) {
                this._view.webview.postMessage({
                    type: 'codeGenerated',
                    framework: framework,
                    code: code
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating ${framework} code: ${error}`);
        }
    }

    private async exportCode(framework: string, code: string): Promise<void> {
        try {
            const fileExtension = framework === 'cypress' ? 'ts' : 'py';
            const defaultFileName = `test_${this.currentSessionId}_${framework}.${fileExtension}`;
            
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(defaultFileName),
                filters: {
                    'Test Files': [fileExtension],
                    'All Files': ['*']
                }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));
                vscode.window.showInformationMessage(`Test code exported to ${uri.fsPath}`);
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error exporting code: ${error}`);
        }
    }

    private async exportTestData(data: any): Promise<void> {
        try {
            const defaultFileName = `test_data_${this.currentSessionId}.json`;
            
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(defaultFileName),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(data, null, 2), 'utf8'));
                vscode.window.showInformationMessage(`Test data exported to ${uri.fsPath}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error exporting test data: ${error}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TestCaptive Professional</title>
    <style>
        :root {
            --container-paddding: 20px;
            --input-bg: var(--vscode-input-background);
            --input-fg: var(--vscode-input-foreground);
            --border-color: var(--vscode-widget-border);
            --header-bg: var(--vscode-editor-background);
            --header-fg: var(--vscode-foreground);
            --accent-color: var(--vscode-textLink-foreground);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: var(--vscode-font-family); 
            font-size: var(--vscode-font-size); 
            color: var(--vscode-foreground); 
            background-color: var(--vscode-editor-background); 
            height: 100vh; 
            overflow: hidden; 
        }
        
        /* Layout Grid */
        .main-container { 
            display: flex; 
            height: 100vh; 
            width: 100%; 
        }
        
        /* Left Panel (35%) */
        .left-panel { 
            width: 35%; 
            min-width: 300px;
            border-right: 1px solid var(--border-color); 
            display: flex; 
            flex-direction: column; 
            background-color: var(--vscode-sideBar-background);
        }
        
        /* Right Panel (65%) */
        .right-panel { 
            width: 65%; 
            display: flex; 
            flex-direction: column; 
            background-color: var(--vscode-editor-background);
        }

        /* Panel Sections */
        .panel-section {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .panel-header {
            padding: 10px 16px;
            background-color: var(--vscode-titleBar-activeBackground);
            color: var(--vscode-titleBar-activeForeground);
<<<<<<< HEAD
=======
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .left-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }

        /* Setup Section */
        .setup-section {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
        }

        .setup-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
            color: var(--vscode-foreground);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .connection-status {
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
        }

        .connection-status.connected {
            background-color: rgba(40, 167, 69, 0.1);
            color: #28a745;
            border: 1px solid rgba(40, 167, 69, 0.3);
        }

        .connection-status.disconnected {
            background-color: rgba(220, 53, 69, 0.1);
            color: #dc3545;
            border: 1px solid rgba(220, 53, 69, 0.3);
        }        .url-input {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 13px;
            margin-bottom: 12px;
        }

        .auto-launch-info {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background-color: rgba(0, 122, 204, 0.1);
            border: 1px solid rgba(0, 122, 204, 0.3);
            border-radius: 4px;
            margin-bottom: 16px;
        }

        .info-icon {
            font-size: 14px;
        }

        .info-text {
            font-size: 12px;
            color: var(--vscode-foreground);
            opacity: 0.9;
        }

        /* Session Controls */
        .session-controls {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 20px;
        }

        .controls-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
            color: var(--vscode-foreground);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .control-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .control-btn {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 6px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            transition: all 0.2s ease;
        }

        .control-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .control-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .control-btn.primary {
            background-color: #007acc;
            color: white;
            border-color: #007acc;
        }

        .control-btn.primary:hover {
            background-color: #005a9e;
        }

        .control-btn.danger {
            background-color: #dc3545;
            color: white;
            border-color: #dc3545;
        }

        .control-btn.danger:hover {
            background-color: #c82333;
        }

        .session-info {
            margin-top: 16px;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        /* RIGHT PANEL - Data & Code */
        .right-panel {
            width: 65%;
            background-color: var(--vscode-editor-background);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .right-header {
            padding: 16px;
            background-color: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-widget-border);
            font-weight: 600;
            font-size: 16px;
            color: var(--vscode-titleBar-activeForeground);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .right-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* Three Sub-sections in Right Panel */
        .right-section {
            border-bottom: 1px solid var(--vscode-widget-border);
            background-color: var(--vscode-editor-background);
        }

        .right-section:last-child {
            border-bottom: none;
            flex: 1;
        }

        .section-header {
            padding: 12px 16px;
            background-color: var(--vscode-input-background);
            border-bottom: 1px solid var(--vscode-widget-border);
>>>>>>> b88ef7ee0f23a8ca3beb23b4963704be4293f3aa
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
        }

        .panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 0;
        }

        /* Specific Sections */
        .import-section {
            flex: 0 0 auto; /* Fixed height based on content */
            border-bottom: 1px solid var(--border-color);
            padding: 16px;
        }

        .events-section {
            flex: 1; /* Takes remaining space in left panel */
        }

        .data-section {
            height: 40%; /* Top 40% of right panel */
            border-bottom: 1px solid var(--border-color);
        }

        .code-section {
            height: 60%; /* Bottom 60% of right panel */
        }

        /* Components */
        .file-drop-zone {
            border: 2px dashed var(--border-color);
            border-radius: 6px;
            padding: 20px;
            text-align: center;
            background-color: var(--vscode-input-background);
            transition: all 0.2s;
            cursor: pointer;
            position: relative;
        }
        .file-drop-zone:hover {
            border-color: var(--accent-color);
            background-color: var(--vscode-list-hoverBackground);
        }
        .file-drop-zone input[type=file] {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            opacity: 0;
            cursor: pointer;
        }
        
        .btn {
            padding: 6px 12px;
            border: 1px solid var(--vscode-button-border);
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
        }
        .btn:hover { background-color: var(--vscode-button-hoverBackground); }
        .btn-sm { padding: 2px 8px; font-size: 11px; }

        /* Events List */
        .event-item {
            display: flex;
            align-items: flex-start;
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-tree-indentGuidesStroke);
            cursor: default;
        }
        .event-item:hover { background-color: var(--vscode-list-hoverBackground); }
        .event-icon {
            width: 24px; height: 24px;
            border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            margin-right: 10px;
            font-size: 14px;
            flex-shrink: 0;
        }
        .event-details { flex: 1; overflow: hidden; }
        .event-title { font-weight: 600; font-size: 12px; margin-bottom: 2px; }
        .event-subtitle { font-size: 11px; color: var(--vscode-descriptionForeground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        /* Data Table */
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { text-align: left; padding: 8px; background-color: var(--vscode-list-hoverBackground); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; }
        .data-table td { padding: 8px; border-bottom: 1px solid var(--vscode-tree-indentGuidesStroke); }
        .data-table tr:hover { background-color: var(--vscode-list-hoverBackground); }

        /* Code Editor */
        .code-toolbar {
            display: flex;
            background-color: var(--vscode-editor-background);
            border-bottom: 1px solid var(--border-color);
        }
        .tab-btn {
            padding: 8px 16px;
            background: none;
            border: none;
            color: var(--vscode-tab-inactiveForeground);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            font-size: 12px;
        }
        .tab-btn.active {
            color: var(--vscode-tab-activeForeground);
            border-bottom-color: var(--accent-color);
        }
        .code-content {
            width: 100%;
            height: calc(100% - 35px);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: none;
            resize: none;
            padding: 16px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.5;
        }
        .code-content:focus { outline: none; }

    </style>
</head>
<body>
    <div class="main-container">
        <!-- LEFT PANEL -->
        <div class="left-panel">
            <!-- 1. Import Section -->
            <div class="panel-header">
                <span>Import Recording</span>
            </div>
<<<<<<< HEAD
            <div class="import-section">
                <div class="file-drop-zone">
                    <div style="font-size: 24px; margin-bottom: 8px;">📂</div>
                    <div style="font-weight: 600; margin-bottom: 4px;">Click to Select File</div>
                    <div style="font-size: 11px; color: var(--vscode-descriptionForeground);">Supports .json session files</div>
                    <input type="file" id="fileInput" accept=".json" onchange="handleFileUpload(this)">
=======
            <div class="left-content">                <!-- Setup Section -->
                <div class="setup-section">
                    <div class="setup-title">
                        🔧 Configuration
                    </div>
                    
                    <div id="connectionStatus" class="connection-status disconnected">
                        <span class="status-indicator disconnected"></span>
                        Checking connection...
                    </div>
                    
                    <input type="text" class="url-input" id="applicationUrl" 
                           placeholder="Enter application URL (e.g., http://localhost:8080)" 
                           value="http://localhost:8080">
                      <div class="auto-launch-info">
                        <span class="info-icon">🚀</span>
                        <span class="info-text">Auto-Launch: TestCaptive will open Edge browser and navigate to your URL automatically</span>
                    </div>
                    
                    <button class="control-btn" onclick="checkConnection()">
                        🔄 Refresh Connection
                    </button>
>>>>>>> b88ef7ee0f23a8ca3beb23b4963704be4293f3aa
                </div>
                <div id="sessionInfo" style="margin-top: 10px; font-size: 11px; color: var(--vscode-descriptionForeground); text-align: center;">
                    No session loaded
                </div>
            </div>

<<<<<<< HEAD
            <!-- 2. Events Section -->
            <div class="panel-header">
                <span>Captured Events</span>
                <span id="eventsCount" style="font-size: 11px; opacity: 0.7;">0</span>
            </div>
            <div class="panel-content events-section">
                <div id="eventsList">
                    <div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground); font-size: 12px;">
                        Events will appear here after import.
=======
                <!-- Session Controls -->
                <div class="session-controls">
                    <div class="controls-title">
                        ⏺️ Recording Session
                    </div>
                      <div class="control-buttons">
                        <button id="startBtn" class="control-btn primary" onclick="startRecording()">
                            🚀 Start Recording & Launch Browser
                        </button>
                        <button id="stopBtn" class="control-btn danger" onclick="stopRecording()" disabled>
                            ⏹️ Stop Recording
                        </button>
                    </div>
                    
                    <div id="sessionInfo" class="session-info">
                        Status: Ready to record
>>>>>>> b88ef7ee0f23a8ca3beb23b4963704be4293f3aa
                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT PANEL -->
        <div class="right-panel">
            <!-- 3. Data Section -->
            <div class="panel-header">
                <span>Extracted Test Data</span>
                <button class="btn btn-sm" onclick="exportTestData()">Export JSON</button>
            </div>
            <div class="panel-content data-section">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 30%">Field Name</th>
                            <th style="width: 70%">Value</th>
                        </tr>
                    </thead>
                    <tbody id="dataBody">
                        <tr>
                            <td colspan="2" style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">
                                No data extracted yet.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- 4. Code Section -->
            <div class="panel-header">
                <span>GENERATED TEST CODE</span>
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-sm" onclick="refreshCode()" title="Refresh Code">🔄 Refresh</button>
                    <button class="btn btn-sm" onclick="copyCode()" title="Copy Code">📋 Copy</button>
                </div>
            </div>
            <div class="code-toolbar">
                <button class="tab-btn active" onclick="selectFramework('selenium')">Selenium</button>
                <button class="tab-btn" onclick="selectFramework('playwright')">Playwright</button>
                <button class="tab-btn" onclick="selectFramework('cypress')">Cypress</button>
            </div>
            <div class="panel-content code-section">
                <textarea id="codeEditor" class="code-content" readonly placeholder="// Generated test code will appear here..."></textarea>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentFramework = 'selenium';
        let currentEvents = [];
        let currentTestData = {};

<<<<<<< HEAD
        // --- File Handling ---
        function handleFileUpload(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const json = JSON.parse(content);
=======
        // Initialize connection status
        function checkConnection() {
            vscode.postMessage({
                type: 'checkConnection'
            });
        }        // Recording controls        function startRecording() {
            console.log('Starting recording with auto-launch...');
            isRecording = true;
            
            const url = document.getElementById('applicationUrl').value;
            
            // Update UI
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            document.getElementById('sessionInfo').innerHTML = 
                '<span class="status-indicator recording"></span>🚀 Opening Edge browser and starting recording...';
            
            // Send message to extension
            vscode.postMessage({
                type: 'startRecording',
                applicationUrl: url
            });
        }

        function stopRecording() {
            console.log('Stopping recording...');
            isRecording = false;
            
            // Update UI
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
            document.getElementById('sessionInfo').innerHTML = 
                '<span class="status-indicator connected"></span>Recording stopped. Ready to generate code.';
            
            // Send message to extension
            vscode.postMessage({
                type: 'stopRecording'
            });
        }

        // Framework selection
        function selectFramework(framework) {
            currentFramework = framework;
            
            // Update tab styling
            document.querySelectorAll('.framework-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector('[data-framework="' + framework + '"]').classList.add('active');
            
            // Update status
            document.getElementById('codeStatus').textContent = framework + ' framework selected';
            
            console.log('Framework selected:', framework);
        }

        // Code generation
        function generateCode() {
            if (currentEvents.length === 0) {
                document.getElementById('codeStatus').textContent = 'No events to generate code from';
                return;
            }

            console.log('Generating code for framework:', currentFramework);
            document.getElementById('codeStatus').textContent = 'Generating code...';
            
            vscode.postMessage({
                type: 'generateCode',
                framework: currentFramework
            });
        }

        // Copy code to clipboard
        function copyCode() {
            const codeEditor = document.getElementById('codeEditor');
            if (codeEditor.value) {
                navigator.clipboard.writeText(codeEditor.value).then(() => {
                    document.getElementById('codeStatus').textContent = 'Code copied to clipboard!';
                    setTimeout(() => {
                        document.getElementById('codeStatus').textContent = currentFramework + ' code ready';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy code:', err);
                    document.getElementById('codeStatus').textContent = 'Failed to copy code';
                });
            } else {
                document.getElementById('codeStatus').textContent = 'No code to copy';
            }
        }

        // Export functions
        function exportTestData() {
            if (Object.keys(currentTestData).length === 0) {
                alert('No test data to export');
                return;
            }
            
            console.log('Exporting test data...');
            vscode.postMessage({
                type: 'exportTestData',
                data: currentTestData
            });
        }

        // Update events list
        function updateEventsList() {
            const eventsList = document.getElementById('eventsList');
            const eventsCount = document.getElementById('eventsCount');
            
            eventsCount.textContent = currentEvents.length + ' events';
            
            if (currentEvents.length === 0) {
                eventsList.innerHTML = '<div class="empty-state">No events captured yet. Start recording to see events here.</div>';
                return;
            }

            eventsList.innerHTML = '';
            currentEvents.forEach((event, index) => {
                const eventItem = document.createElement('div');
                eventItem.className = 'event-item';
                
                const eventType = event.event || event.type || 'unknown';
                const iconClass = getEventIconClass(eventType);
                const targetText = getEventTargetText(event);
                const valueText = getEventValueText(event);
                
                eventItem.innerHTML = 
                    '<div class="event-icon ' + iconClass + '">' + eventType.charAt(0).toUpperCase() + '</div>' +
                    '<div class="event-details">' +
                        '<div class="event-type">' + eventType.toUpperCase() + '</div>' +
                        '<div class="event-target">' + targetText + '</div>' +
                        (valueText ? '<div class="event-value">Value: ' + valueText + '</div>' : '') +
                    '</div>';
                
                eventsList.appendChild(eventItem);
            });
        }

        function getEventIconClass(eventType) {
            switch(eventType.toLowerCase()) {
                case 'click': return 'click';
                case 'input': return 'input';
                case 'change': return 'change';
                case 'submit': return 'submit';
                default: return 'click';
            }
        }

        function getEventTargetText(event) {
            if (event.element) {
                const tag = event.element.tag || '';
                const id = event.element.id || '';
                const className = event.element.class || event.element.className || '';
                
                if (id) return '#' + id;
                if (className) return '.' + className.split(' ')[0];
                if (tag) return '<' + tag + '>';
            }
            return 'element';
        }

        function getEventValueText(event) {
            return event.value || event.inputValue || '';
        }

        // Update test data table
        function updateTestDataTable() {
            const dataTable = document.getElementById('dataTable');
            
            if (Object.keys(currentTestData).length === 0) {
                dataTable.innerHTML = '<div class="empty-state">Test data will appear here after capturing form inputs.</div>';
                return;
            }
            
            dataTable.innerHTML = '';
            Object.entries(currentTestData).forEach(([key, value]) => {
                const dataRow = document.createElement('div');
                dataRow.className = 'data-row';
                dataRow.innerHTML = 
                    '<div class="data-cell data-key">' + key + '</div>' +
                    '<div class="data-cell data-value">' + value + '</div>';
                dataTable.appendChild(dataRow);
            });
        }

        // Extract test data from events
        function extractTestData() {
            currentTestData = {};
            currentEvents.forEach((event, index) => {
                const value = event.value || event.inputValue;
                if (value && value.trim()) {
                    let key = '';
                    if (event.element) {
                        if (event.element.id) {
                            key = event.element.id;
                        } else if (event.element.name) {
                            key = event.element.name;
                        } else if (event.element.tag) {
                            key = event.element.tag + '_' + index;
                        } else {
                            key = 'field_' + index;
                        }
                    } else {
                        key = 'field_' + index;
                    }
>>>>>>> b88ef7ee0f23a8ca3beb23b4963704be4293f3aa
                    
                    // Immediate Client-Side Preview
                    document.getElementById('sessionInfo').textContent = 'Loaded: ' + file.name;
                    
                    // Extract events and data immediately for preview
                    if (json.events) {
                        currentEvents = json.events;
                        updateEventsList();
                        
                        // Auto-extract data if missing
                        if (!json.testData || Object.keys(json.testData).length === 0) {
                            extractDataFromEvents(json.events);
                        } else {
                            currentTestData = json.testData;
                            updateTestDataTable();
                        }
                    }

                    // Send to Extension
                    vscode.postMessage({
                        type: 'importSession',
                        jsonContent: content
                    });
                } catch (err) {
                    console.error('Error parsing JSON', err);
                    document.getElementById('sessionInfo').textContent = 'Error: Invalid JSON file';
                }
            };
            reader.readAsText(file);
        }

        // --- Data Extraction Logic ---
        function extractDataFromEvents(events) {
            const data = {};
            events.forEach((event, index) => {
                const eventType = event.event || event.type;
                
                // 1. Extract Input Values
                if (eventType === 'input' || eventType === 'change') {
                    // Check inputValue (top level) or element.value
                    const value = event.inputValue || (event.element && event.element.value);
                    
                    if (value) {
                        let key = 'unknown_field';
                        if (event.element) {
                            // Priority: testid > id > name > placeholder > tag
                            key = event.element.testid || 
                                  event.element['data-testid'] || 
                                  event.element.id || 
                                  event.element.name || 
                                  (event.element.placeholder ? event.element.placeholder.toLowerCase().replace(/\s+/g, '_') : null) ||
                                  event.element.tag || 
                                  'input';
                        }
                        data[key] = value;
                    }
                }

                // 2. Extract Button Text (Only for actual buttons)
                if (eventType === 'click' && event.element && event.element.text) {
                    const tag = event.element.tag ? event.element.tag.toLowerCase() : '';
                    const type = event.element.type ? event.element.type.toLowerCase() : '';
                    
                    if (tag === 'button' || tag === 'a' || (tag === 'input' && (type === 'submit' || type === 'button'))) {
                        const buttonKey = 'button_' + index + '_text';
                        data[buttonKey] = event.element.text.trim();
                    }
                }

                // 3. Extract Navigation URLs
                if (eventType === 'navigation' && event.page) {
                    const urlKey = 'navigation_' + index + '_url';
                    data[urlKey] = event.page.url;
                }
            });
            currentTestData = data;
            updateTestDataTable();
        }

        // --- UI Updates ---
        function updateEventsList() {
            const list = document.getElementById('eventsList');
            document.getElementById('eventsCount').textContent = currentEvents.length;
            list.innerHTML = '';
            
            currentEvents.forEach((event, index) => {
                const div = document.createElement('div');
                div.className = 'event-item';
                
                let icon = '🔹';
                let color = '#007acc';
                const eventType = event.event || event.type;
                
                if (eventType === 'click') { icon = '🖱️'; color = '#007acc'; }
                if (eventType === 'input' || eventType === 'change') { icon = '⌨️'; color = '#28a745'; }
                if (eventType === 'navigation') { icon = '🧭'; color = '#ffc107'; }
                
                // Smart Target Display
                let target = 'Window';
                let details = '';
                
                if (event.element) {
                    // Priority: testid > id > name > placeholder > text > tag
                    const el = event.element;
                    if (el.testid || el['data-testid']) {
                        target = \`TestID: \${el.testid || el['data-testid']}\`;
                    } else if (el.id) {
                        target = \`ID: #\${el.id}\`;
                    } else if (el.name) {
                        target = \`Name: \${el.name}\`;
                    } else if (el.placeholder) {
                        target = \`Placeholder: "\${el.placeholder}"\`;
                    } else if (el.text) {
                        target = \`Text: "\${el.text.substring(0, 20)}\${el.text.length > 20 ? '...' : ''}"\`;
                    } else {
                        target = \`<\${el.tag || el.tagName}>\`;
                    }
                }
                
                if (eventType === 'navigation' && event.page) {
                    target = event.page.title || event.page.url;
                    details = event.page.url;
                }
                
                // Value Display
                const val = event.inputValue || event.value || (event.element && event.element.value);
                if ((eventType === 'input' || eventType === 'change') && val) {
                    details = \`Typed: "\${val}"\`;
                } else if (eventType === 'click' && event.element && event.element.text) {
                    details = \`Clicked: "\${event.element.text.trim().substring(0, 30)}"\`;
                }

                div.innerHTML = \`
                    <div class="event-icon" style="background-color: \${color}20; color: \${color}">\${icon}</div>
                    <div class="event-details">
                        <div class="event-title">\${eventType.toUpperCase()}</div>
                        <div class="event-subtitle" style="font-weight: 500; color: var(--vscode-foreground);">\${target}</div>
                        \${details ? \`<div class="event-subtitle" style="margin-top: 2px; color: var(--vscode-textLink-foreground);">\${details}</div>\` : ''}
                    </div>
                    <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">#\${index + 1}</div>
                \`;
                list.appendChild(div);
            });
        }

        function updateTestDataTable() {
            const tbody = document.getElementById('dataBody');
            tbody.innerHTML = '';
            
            const keys = Object.keys(currentTestData);
            if (keys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">No data extracted yet.</td></tr>';
                return;
            }

            keys.forEach(key => {
                const row = document.createElement('tr');
                row.innerHTML = \`
                    <td><span style="font-family: monospace; background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">\${key}</span></td>
                    <td>\${currentTestData[key]}</td>
                \`;
                tbody.appendChild(row);
            });
        }

        // --- Framework & Code ---
        function selectFramework(framework) {
            currentFramework = framework;
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.toLowerCase() === framework) btn.classList.add('active');
            });
            // Trigger generation if we have events
            if (currentEvents.length > 0) generateCode();
        }

        function generateCode() {
            if (currentEvents.length === 0) return;
            document.getElementById('codeEditor').value = '// Generating ' + currentFramework + ' code...';
            vscode.postMessage({ type: 'generateCode', framework: currentFramework });
        }

        function refreshCode() {
            generateCode();
        }

        function copyCode() {
            const code = document.getElementById('codeEditor').value;
            if (code) {
                navigator.clipboard.writeText(code);
                // Visual feedback
                const btn = document.querySelector('button[title="Copy Code"]');
                if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = '✅ Copied';
                    setTimeout(() => btn.textContent = originalText, 2000);
                }
            }
        }

        function exportTestData() {
            if (Object.keys(currentTestData).length === 0) return;
            vscode.postMessage({ type: 'exportTestData', data: currentTestData });
        }

        // --- Message Handling ---
        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.type) {
                case 'sessionLoaded':
                    // Server confirmed load
                    currentEvents = message.events || [];
                    // Merge server data if available, otherwise keep client extracted
                    if (message.testData && Object.keys(message.testData).length > 0) {
                        currentTestData = message.testData;
                    }
                    updateEventsList();
                    updateTestDataTable();
                    generateCode(); // Auto-generate code on load
                    break;
                case 'codeGenerated':
                    document.getElementById('codeEditor').value = message.code;
                    break;
            }
        });
    </script>
</body>
</html>`;
    }
}
