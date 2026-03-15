// Main extension entry point
import * as vscode from 'vscode';
import { ReviewWebviewProvider } from './webview-ui/review-panel';
import { TestDataManager } from './test-data-manager';
import { CodeGenerator } from './code-generator';

export function activate(context: vscode.ExtensionContext) {
    console.log('TestCaptive extension is now active!');

    try {
        // Initialize core services
        const testDataManager = new TestDataManager(context);
        const codeGenerator = new CodeGenerator();
        
        // Initialize single unified webview provider
        const mainProvider = new ReviewWebviewProvider(context.extensionUri, testDataManager, codeGenerator);

        // Register single webview provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('testcaptive.mainView', mainProvider)
        );

        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand('testcaptive.start', () => {
                vscode.commands.executeCommand('workbench.view.extension.testcaptive');
            }),

            // Command to manually load most recent session (for debugging)
            vscode.commands.registerCommand('testcaptive.loadRecentSession', () => {
                console.log('Manual command: Loading recent session...');
                mainProvider.loadMostRecentSession();
            })
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`TestCaptive failed to activate: ${message}`);
        console.error('TestCaptive activation error:', error);
    }
}

export function deactivate() {
    console.log('TestCaptive extension is being deactivated');
}
