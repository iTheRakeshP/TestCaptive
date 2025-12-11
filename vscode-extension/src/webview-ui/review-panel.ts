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
            overflow: hidden;
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
            flex: 0 0 40%; /* Default to 40%, but resizable */
            min-height: 100px;
            max-height: 80%;
            overflow: auto;
            display: flex;
            flex-direction: column;
        }

        .code-section {
            flex: 1; /* Takes remaining space */
            min-height: 100px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .resize-handle {
            height: 8px;
            background-color: var(--border-color);
            cursor: ns-resize;
            position: relative;
            flex-shrink: 0;
            transition: background-color 0.2s;
        }
        
        .resize-handle:hover {
            background-color: var(--accent-color);
        }
        
        .resize-handle::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 3px;
            background-color: var(--vscode-foreground);
            opacity: 0.3;
            border-radius: 2px;
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
            position: relative;
        }
        .event-item:hover { 
            background-color: var(--vscode-list-hoverBackground); 
        }
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
            <div class="import-section">
                <div class="file-drop-zone">
                    <div style="font-size: 24px; margin-bottom: 8px;">📂</div>
                    <div style="font-weight: 600; margin-bottom: 4px;">Click to Select File</div>
                    <div style="font-size: 11px; color: var(--vscode-descriptionForeground);">Supports .json session files</div>
                    <input type="file" id="fileInput" accept=".json" onchange="handleFileUpload(this)">
                </div>
                <div id="sessionInfo" style="margin-top: 10px; font-size: 11px; color: var(--vscode-descriptionForeground); text-align: center;">
                    No session loaded
                </div>
            </div>

            <!-- 2. Events Section -->
            <div class="panel-header">
                <span>Captured Events</span>
                <span id="eventsCount" style="font-size: 11px; opacity: 0.7;">0</span>
            </div>
            <div class="panel-content events-section">
                <div id="eventsList">
                    <div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground); font-size: 12px;">
                        Events will appear here after import.
                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT PANEL -->
        <div class="right-panel">
            <!-- 3. Data Section -->
            <div class="panel-header">
                <span>Extracted Test Data</span>
                <button class="btn btn-sm" id="exportTestDataBtn">Export JSON</button>
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

            <!-- Resize Handle -->
            <div class="resize-handle" id="resizeHandle"></div>

            <!-- 4. Code Section -->
            <div class="panel-header">
                <span>GENERATED TEST CODE</span>
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-sm" id="refreshCodeBtn" title="Refresh Code">🔄 Refresh</button>
                    <button class="btn btn-sm" id="copyCodeBtn" title="Copy Code">📋 Copy</button>
                </div>
            </div>
            <div class="code-toolbar">
                <button class="tab-btn active" data-framework="selenium">Selenium</button>
                <button class="tab-btn" data-framework="playwright">Playwright</button>
                <button class="tab-btn" data-framework="cypress">Cypress</button>
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
        let currentSessionId = null;

        // --- File Handling ---
        function handleFileUpload(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const json = JSON.parse(content);
                    
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
                                  (event.element.placeholder ? event.element.placeholder.toLowerCase().replace(/\\s+/g, '_') : null) ||
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
                div.setAttribute('data-event-index', index.toString());
                
                let icon = '🔹';
                let color = '#007acc';
                const eventType = event.event || event.type;
                
                if (eventType === 'click') { icon = '🖱️'; color = '#007acc'; }
                if (eventType === 'input' || eventType === 'change') { icon = '⌨️'; color = '#28a745'; }
                if (eventType === 'navigation') { icon = '🧭'; color = '#ffc107'; }
                if (eventType === 'assertion') { icon = '✅'; color = '#9333ea'; }
                
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
                
                // Assertion Display
                if (eventType === 'assertion' && event.assertion) {
                    target = event.assertion.description || event.assertion.type;
                    if (event.assertion.expectedValue) {
                        details = 'Expected: "' + event.assertion.expectedValue + '"';
                    }
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
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                        <div style="font-size: 10px; color: var(--vscode-descriptionForeground);">#\${index + 1}</div>
                    </div>
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

        // --- Resize Functionality ---
        (function initResize() {
            const resizeHandle = document.getElementById('resizeHandle');
            const dataSection = document.querySelector('.data-section');
            const codeSection = document.querySelector('.code-section');
            const rightPanel = document.querySelector('.right-panel');
            
            let isResizing = false;
            let startY = 0;
            let startDataHeight = 0;
            
            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startY = e.clientY;
                startDataHeight = dataSection.offsetHeight;
                
                // Prevent text selection during drag
                e.preventDefault();
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'ns-resize';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const deltaY = e.clientY - startY;
                const newDataHeight = startDataHeight + deltaY;
                const totalHeight = rightPanel.offsetHeight - resizeHandle.offsetHeight;
                const minHeight = 100;
                const maxHeight = totalHeight - 100; // Leave at least 100px for code section
                
                // Clamp the height
                const clampedHeight = Math.max(minHeight, Math.min(newDataHeight, maxHeight));
                const percentage = (clampedHeight / totalHeight) * 100;
                
                dataSection.style.flex = \`0 0 \${percentage}%\`;
            });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.userSelect = '';
                    document.body.style.cursor = '';
                }
            });
        })();

        // --- Message Handling ---
        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.type) {
                case 'sessionLoaded':
                    // Server confirmed load
                    currentSessionId = message.sessionId;
                    currentEvents = message.events || [];
                    // Merge server data if available, otherwise keep client extracted
                    if (message.testData && Object.keys(message.testData).length > 0) {
                        currentTestData = message.testData;
                    }
                    console.log('Session loaded:', currentSessionId, 'with', currentEvents.length, 'events');
                    updateEventsList();
                    updateTestDataTable();
                    generateCode(); // Auto-generate code on load
                    break;
                case 'codeGenerated':
                    document.getElementById('codeEditor').value = message.code;
                    break;
            }
        });

        // --- Button Event Listeners ---
        document.getElementById('exportTestDataBtn').addEventListener('click', exportTestData);
        document.getElementById('refreshCodeBtn').addEventListener('click', refreshCode);
        document.getElementById('copyCodeBtn').addEventListener('click', copyCode);
        
        // Framework tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const framework = btn.getAttribute('data-framework');
                selectFramework(framework);
            });
        });
    </script>
</body>
</html>`;
    }
}
