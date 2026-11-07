import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { findLanguageForFile, LanguageDefinition } from './registry';
import { buildExecutionPlan } from './executor';
import { LiveServerManager, configureHtmlAction } from './liveServer';

const TERMINAL_NAME = 'Universal Run';
let runnerTerminal: vscode.Terminal | undefined;
let isRunPending = false;
let liveServerManager: LiveServerManager | undefined;

export function activate(context: vscode.ExtensionContext) {
    liveServerManager = new LiveServerManager();
    context.subscriptions.push(liveServerManager);

    context.subscriptions.push(
        vscode.window.onDidCloseTerminal((closedTerminal) => {
            if (closedTerminal === runnerTerminal) {
                runnerTerminal = undefined;
            }
        })
    );

    // 1. Primary "Run File" command
    const runDisposable = vscode.commands.registerCommand('universal-runner.run', async (uri?: vscode.Uri) => {
        if (isRunPending) {
            return;
        }
        isRunPending = true;
        try {
            await handleRun(uri);
        } finally {
            setTimeout(() => {
                isRunPending = false;
            }, 500);
        }
    });
    context.subscriptions.push(runDisposable);

    // 2. HTML: Run with Live Server
    const runHtmlLiveServerDisposable = vscode.commands.registerCommand(
        'universal-runner.runHtmlLiveServer',
        async (uri?: vscode.Uri) => {
            const filePath = await resolveTargetFilePath(uri);
            if (!filePath) {
                return;
            }
            if (liveServerManager) {
                await liveServerManager.start(filePath);
            }
        }
    );
    context.subscriptions.push(runHtmlLiveServerDisposable);

    // 3. HTML: Run Path (Direct file path in default browser)
    const runHtmlPathDisposable = vscode.commands.registerCommand(
        'universal-runner.runHtmlPath',
        async (uri?: vscode.Uri) => {
            const filePath = await resolveTargetFilePath(uri);
            if (!filePath) {
                return;
            }
            await handleRunPath(filePath);
        }
    );
    context.subscriptions.push(runHtmlPathDisposable);

    // 4. HTML: Configure Default Action (Customize Play button behavior)
    const configureHtmlActionDisposable = vscode.commands.registerCommand(
        'universal-runner.configureHtmlAction',
        async () => {
            await configureHtmlAction();
        }
    );
    context.subscriptions.push(configureHtmlActionDisposable);

    // 5. HTML: Stop Live Server
    const stopLiveServerDisposable = vscode.commands.registerCommand(
        'universal-runner.stopLiveServer',
        async () => {
            if (liveServerManager) {
                await liveServerManager.stop();
            }
        }
    );
    context.subscriptions.push(stopLiveServerDisposable);

    // 6. Live Server options menu (from status bar or command palette)
    const liveServerMenuDisposable = vscode.commands.registerCommand(
        'universal-runner.showLiveServerMenu',
        async () => {
            if (liveServerManager) {
                await liveServerManager.showMenu();
            }
        }
    );
    context.subscriptions.push(liveServerMenuDisposable);
}

export function deactivate() {
    runnerTerminal = undefined;
    if (liveServerManager) {
        liveServerManager.dispose();
        liveServerManager = undefined;
    }
}

/**
 * Resolves the target file path from an explicit Uri (e.g. title bar click)
 * or the active text editor. Automatically saves dirty documents before running.
 */
async function resolveTargetFilePath(uri?: vscode.Uri): Promise<string | undefined> {
    if (uri && uri.fsPath) {
        const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === uri.fsPath);
        if (doc && doc.isDirty) {
            const saved = await doc.save();
            if (!saved) {
                vscode.window.showErrorMessage('Failed to save file before running.');
                return undefined;
            }
        }
        return uri.fsPath;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found.');
        return undefined;
    }

    const document = editor.document;

    if (document.isUntitled) {
        vscode.window.showErrorMessage('Please save the file before running.');
        return undefined;
    }

    if (document.isDirty) {
        const saved = await document.save();
        if (!saved) {
            vscode.window.showErrorMessage('Failed to save file before running.');
            return undefined;
        }
    }

    return document.uri.fsPath;
}

/**
 * Handles HTML execution based on user configuration (Live Server, Run Path, or Prompt)
 */
async function handleHtmlRun(filePath: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('universalRunner');
    const defaultAction = config.get<string>('htmlDefaultAction') || 'liveServer';

    if (defaultAction === 'runPath') {
        await handleRunPath(filePath);
    } else if (defaultAction === 'liveServer') {
        if (liveServerManager) {
            await liveServerManager.start(filePath);
        }
    } else {
        // Prompt user
        const items = [
            {
                label: '$(radio-tower) Live Server',
                description: 'Launch local development server with auto-reload on file save',
                value: 'liveServer'
            },
            {
                label: '$(browser) Run Path (File Path)',
                description: 'Open file directly in default web browser via file:/// URL',
                value: 'runPath'
            }
        ];
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select how you want to run this HTML file'
        });
        if (!selected) {
            return;
        }
        if (selected.value === 'liveServer' && liveServerManager) {
            await liveServerManager.start(filePath);
        } else {
            await handleRunPath(filePath);
        }
    }
}

/**
 * Opens the file path directly in the default system web browser (Run Path)
 */
async function handleRunPath(filePath: string): Promise<void> {
    await vscode.env.openExternal(vscode.Uri.file(filePath));
    vscode.window.showInformationMessage(`Opened ${path.basename(filePath)} in default browser (file path).`);
}

async function handleRun(uri?: vscode.Uri) {
    const filePath = await resolveTargetFilePath(uri);
    if (!filePath) {
        return;
    }

    const lang = findLanguageForFile(filePath);

    if (!lang) {
        const ext = path.extname(filePath) || path.basename(filePath);
        vscode.window.showErrorMessage(`Universal Run Button: File type '${ext}' is not supported.`);
        return;
    }

    // Special handling: HTML files with customizable Live Server or Run Path
    if (lang.id === 'html') {
        await handleHtmlRun(filePath);
        return;
    }

    // Read user configuration for custom tool paths
    const config = vscode.workspace.getConfiguration('universalRunner');
    const customToolPaths = config.get<Record<string, string>>('toolPaths') || {};

    // 1. Toolchain availability check
    if (lang.requiredTools && lang.requiredTools.length > 0) {
        for (const tool of lang.requiredTools) {
            const configuredExecutable = customToolPaths[tool] || tool;
            const check = await checkToolAvailable(configuredExecutable);
            if (!check.available) {
                showMissingToolError(tool, lang.name, lang.installGuidance);
                return;
            }
        }
    }

    const isWindows = process.platform === 'win32';
    const document = vscode.workspace.textDocuments.find(d => d.uri.fsPath === filePath) || vscode.window.activeTextEditor?.document;
    const fileContent = document ? document.getText() : '';
    const plan = buildExecutionPlan(lang, filePath, fileContent, isWindows, customToolPaths);

    // 2. Handle Custom VS Code actions
    if (plan.customExecution === 'open-browser' && plan.browserTarget) {
        await handleRunPath(plan.browserTarget);
        return;
    }

    if (plan.customExecution === 'markdown-preview') {
        await vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(filePath));
        return;
    }

    if (plan.warningNotice) {
        vscode.window.showWarningMessage(plan.warningNotice);
    }

    if (!plan.command) {
        return;
    }

    // 3. Send command to integrated terminal
    const terminal = getOrCreateTerminal();
    terminal.show();
    terminal.sendText(plan.command, true);
}

function getOrCreateTerminal(): vscode.Terminal {
    const existing = vscode.window.terminals.find(t => t.name === TERMINAL_NAME);
    if (existing) {
        runnerTerminal = existing;
        return existing;
    }

    runnerTerminal = vscode.window.createTerminal(TERMINAL_NAME);
    return runnerTerminal;
}

function checkToolAvailable(toolName: string): Promise<{ available: boolean }> {
    return new Promise((resolve) => {
        let probeCmd = `${toolName} --version`;
        if (toolName === 'java' || toolName === 'javac') {
            probeCmd = `${toolName} -version`;
        } else if (toolName === 'cmd') {
            resolve({ available: true });
            return;
        } else if (toolName === 'powershell') {
            resolve({ available: true });
            return;
        } else if (toolName === 'python' && process.platform === 'win32') {
            probeCmd = `python --version`;
        }

        exec(probeCmd, (error) => {
            if (error) {
                const lookupCmd = process.platform === 'win32' ? `where.exe ${toolName}` : `which ${toolName}`;
                exec(lookupCmd, (lookupError) => {
                    resolve({ available: !lookupError });
                });
            } else {
                resolve({ available: true });
            }
        });
    });
}

function showMissingToolError(tool: string, langName: string, guidance: string) {
    const terminal = getOrCreateTerminal();
    terminal.show();
    const msg = `Tool '${tool}' required for ${langName} is not found in PATH.\n${guidance}\nTip: You can configure custom paths in Settings -> 'universalRunner.toolPaths'.`;
    terminal.sendText(`Write-Host "${msg}" -ForegroundColor Red`);
    vscode.window.showErrorMessage(`'${tool}' required for ${langName} is not installed or not in PATH.`);
}
