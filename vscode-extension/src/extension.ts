// Main extension entry point
import * as vscode from 'vscode';
import { ReviewWebviewProvider } from './webview-ui/review-panel';
import { TestDataManager } from './test-data-manager';
import { CodeGenerator } from './code-generator';
import { logger, LogLevel } from './logger';

export function activate(context: vscode.ExtensionContext) {
    // Apply log level from settings
    const config = vscode.workspace.getConfiguration('testcaptive');
    const levelMap: Record<string, LogLevel> = { debug: LogLevel.DEBUG, info: LogLevel.INFO, warn: LogLevel.WARN, error: LogLevel.ERROR };
    logger.setLevel(levelMap[config.get<string>('logLevel', 'info')] ?? LogLevel.INFO);

    // Re-apply on settings change
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('testcaptive.logLevel')) {
                const newLevel = vscode.workspace.getConfiguration('testcaptive').get<string>('logLevel', 'info');
                logger.setLevel(levelMap[newLevel] ?? LogLevel.INFO);
                logger.info('Log level changed to:', newLevel);
            }
        })
    );

    logger.info('TestCaptive extension is now active!');

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
                logger.info('Manual command: Loading recent session...');
                mainProvider.loadMostRecentSession();
            })
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`TestCaptive failed to activate: ${message}`);
        logger.error('TestCaptive activation error:', error);
    }
}

export function deactivate() {
    logger.info('TestCaptive extension is being deactivated');
    logger.dispose();
}
