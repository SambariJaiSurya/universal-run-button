import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { findLanguageForFile, LanguageDefinition } from './registry';
import { buildExecutionPlan } from './executor';

const TERMINAL_NAME = 'Universal Run';
let runnerTerminal: vscode.Terminal | undefined;
let isRunPending = false;

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal((closedTerminal) => {
            if (closedTerminal === runnerTerminal) {
                runnerTerminal = undefined;
            }
        })
    );

    const runDisposable = vscode.commands.registerCommand('universal-runner.run', async () => {
        if (isRunPending) {
            return;
        }
        isRunPending = true;
        try {
            await handleRun();
        } finally {
            setTimeout(() => {
                isRunPending = false;
            }, 500);
        }
    });

    context.subscriptions.push(runDisposable);
}

export function deactivate() {
    runnerTerminal = undefined;
}

async function handleRun() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found.');
        return;
    }

    const document = editor.document;

    // Check if the document has been saved to disk
    if (document.isUntitled) {
        vscode.window.showErrorMessage('Please save the file before running.');
        return;
    }

    // Save document if modified
    if (document.isDirty) {
        const saved = await document.save();
        if (!saved) {
            vscode.window.showErrorMessage('Failed to save file before running.');
            return;
        }
    }

    const filePath = document.uri.fsPath;
    const lang = findLanguageForFile(filePath);

    if (!lang) {
        const ext = path.extname(filePath) || path.basename(filePath);
        vscode.window.showErrorMessage(`Universal Run Button: File type '${ext}' is not supported.`);
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
    const plan = buildExecutionPlan(lang, filePath, document.getText(), isWindows, customToolPaths);

    // 2. Handle Custom VS Code actions
    if (plan.customExecution === 'open-browser' && plan.browserTarget) {
        vscode.env.openExternal(vscode.Uri.file(plan.browserTarget));
        vscode.window.showInformationMessage(`Opened ${path.basename(plan.browserTarget)} in your default browser.`);
        return;
    }

    if (plan.customExecution === 'markdown-preview') {
        await vscode.commands.executeCommand('markdown.showPreview', document.uri);
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
        // Probe command: check with tool --version, -version, or /? (for cmd)
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
                // If standard --version fails, try where.exe / which
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
