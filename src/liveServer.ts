import * as vscode from 'vscode';
import * as http from 'http';
import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs';

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
    '.wasm': 'application/wasm'
};

const LIVE_RELOAD_SCRIPT = `
<!-- Universal Run Button: Live Reload Script -->
<script>
(function() {
    try {
        var source = new EventSource('/__universal_live_reload');
        source.onmessage = function(event) {
            if (event.data === 'reload') {
                console.log('[Universal Live Server] File update detected. Reloading page...');
                window.location.reload();
            }
        };
        source.onerror = function() {
            // Native EventSource auto-reconnects when connection is lost
        };
    } catch (err) {
        console.error('[Universal Live Server] Reload connector error:', err);
    }
})();
</script>
`;

function injectReloadScript(html: string): string {
    const bodyIndex = html.toLowerCase().lastIndexOf('</body>');
    if (bodyIndex !== -1) {
        return html.slice(0, bodyIndex) + LIVE_RELOAD_SCRIPT + html.slice(bodyIndex);
    }
    const htmlIndex = html.toLowerCase().lastIndexOf('</html>');
    if (htmlIndex !== -1) {
        return html.slice(0, htmlIndex) + LIVE_RELOAD_SCRIPT + html.slice(htmlIndex);
    }
    return html + '\n' + LIVE_RELOAD_SCRIPT;
}

function findAvailablePort(startPort: number, maxTries: number = 30): Promise<number> {
    return new Promise((resolve, reject) => {
        function test(port: number) {
            const tester = net.createServer();
            tester.unref();
            tester.on('error', (err: any) => {
                if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
                    if (port - startPort < maxTries) {
                        test(port + 1);
                    } else {
                        reject(new Error(`Universal Live Server: No available port found between ${startPort} and ${startPort + maxTries}`));
                    }
                } else {
                    reject(err);
                }
            });
            tester.listen(port, '127.0.0.1', () => {
                tester.close(() => {
                    resolve(port);
                });
            });
        }
        test(startPort);
    });
}

export class LiveServerManager implements vscode.Disposable {
    private server: http.Server | undefined;
    private currentPort: number | undefined;
    private rootDir: string | undefined;
    private lastRelativePath: string = '';
    private clients: Set<http.ServerResponse> = new Set();
    private statusBarItem: vscode.StatusBarItem | undefined;
    private reloadTimer: NodeJS.Timeout | undefined;
    private docSaveListener: vscode.Disposable | undefined;
    private fileWatcher: vscode.FileSystemWatcher | undefined;

    constructor() {
        this.updateContext(false);
    }

    public isRunning(): boolean {
        return this.server !== undefined && this.currentPort !== undefined;
    }

    public getPort(): number | undefined {
        return this.currentPort;
    }

    public getRootDir(): string | undefined {
        return this.rootDir;
    }

    /**
     * Starts Live Server for the target HTML file.
     * Respects user settings for server provider (builtIn, auto, extension, customCommand).
     */
    public async start(filePath: string): Promise<string | undefined> {
        const config = vscode.workspace.getConfiguration('universalRunner');
        const provider = config.get<string>('liveServer.provider') || 'auto';
        const customCmd = config.get<string>('liveServer.customCommand');

        // 1. Custom command support
        if (provider === 'customCommand' || (customCmd && customCmd.trim().length > 0 && provider !== 'builtIn')) {
            return this.launchCustomCommand(customCmd || 'npx live-server', filePath);
        }

        // 2. Ritwick Dey's Live Server extension support
        if (provider === 'auto' || provider === 'extension') {
            const ritwickExt = vscode.extensions.getExtension('ritwickdey.liveserver');
            if (ritwickExt) {
                if (!ritwickExt.isActive) {
                    await ritwickExt.activate();
                }
                await vscode.commands.executeCommand('extension.liveServer.goOnline', vscode.Uri.file(filePath));
                vscode.window.showInformationMessage(`Universal Run: Launched via Live Server extension.`);
                return 'extension:ritwickdey.liveserver';
            } else if (provider === 'extension') {
                const installChoice = await vscode.window.showWarningMessage(
                    "Live Server extension ('ritwickdey.liveserver') is not installed.",
                    'Install Extension',
                    'Use Built-in Live Server'
                );
                if (installChoice === 'Install Extension') {
                    await vscode.commands.executeCommand('workbench.extensions.installExtension', 'ritwickdey.liveserver');
                    return undefined;
                } else if (installChoice !== 'Use Built-in Live Server') {
                    return undefined;
                }
            }
        }

        // 3. Built-in zero-dependency Live Server
        return await this.startBuiltIn(filePath);
    }

    private async startBuiltIn(filePath: string): Promise<string> {
        const fileUri = vscode.Uri.file(filePath);
        const wsFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        const targetRootDir = wsFolder ? wsFolder.uri.fsPath : path.dirname(filePath);
        const relPath = path.relative(targetRootDir, filePath).replace(/\\/g, '/');
        this.lastRelativePath = relPath;

        // If server is already running for this root directory, reuse it
        if (this.server && this.currentPort && this.rootDir === targetRootDir) {
            const encodedSegments = relPath.split('/').map(encodeURIComponent).join('/');
            const targetUrl = `http://127.0.0.1:${this.currentPort}/${encodedSegments}`;
            await vscode.env.openExternal(vscode.Uri.parse(targetUrl));
            vscode.window.showInformationMessage(`Live Server running at http://127.0.0.1:${this.currentPort}/ (Opened ${path.basename(filePath)})`);
            return targetUrl;
        }

        // If running for a different root directory, stop the previous server first
        if (this.isRunning()) {
            await this.stop(false);
        }

        const config = vscode.workspace.getConfiguration('universalRunner');
        const configuredPort = config.get<number>('liveServer.port') || 5500;
        const port = await findAvailablePort(configuredPort);

        this.currentPort = port;
        this.rootDir = targetRootDir;

        this.server = http.createServer((req, res) => this.handleRequest(req, res));

        await new Promise<void>((resolve, reject) => {
            this.server!.listen(port, '127.0.0.1', () => resolve());
            this.server!.on('error', (err) => reject(err));
        });

        this.updateContext(true);
        this.updateStatusBar(port);
        this.setupWatchers(targetRootDir);

        const encodedSegments = relPath.split('/').map(encodeURIComponent).join('/');
        const targetUrl = `http://127.0.0.1:${port}/${encodedSegments}`;
        await vscode.env.openExternal(vscode.Uri.parse(targetUrl));
        vscode.window.showInformationMessage(`Universal Live Server started at http://127.0.0.1:${port}/ (Auto-reloads on save)`);

        return targetUrl;
    }

    private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        const reqHost = req.headers.host || '127.0.0.1';
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(req.url || '/', `http://${reqHost}`);
        } catch {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('400 Bad Request');
            return;
        }

        const pathname = decodeURIComponent(parsedUrl.pathname);

        // Server-Sent Events endpoint for instant live reloading
        if (pathname === '/__universal_live_reload') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });
            res.write(': connected\n\n');
            this.clients.add(res);

            req.on('close', () => {
                this.clients.delete(res);
            });
            return;
        }

        if (!this.rootDir) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Root Directory Not Configured');
            return;
        }

        // Normalize and guard against path traversal attacks
        const relativeFilePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
        let resolvedPath = path.normalize(path.join(this.rootDir, relativeFilePath));

        // Ensure target is inside root directory
        const normalizedRoot = path.normalize(this.rootDir);
        if (!resolvedPath.startsWith(normalizedRoot)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden: Directory traversal is not permitted');
            return;
        }

        // Handle directories: serve index.html if present
        let stat: fs.Stats;
        try {
            stat = fs.statSync(resolvedPath);
            if (stat.isDirectory()) {
                const indexCandidate = path.join(resolvedPath, 'index.html');
                if (fs.existsSync(indexCandidate)) {
                    resolvedPath = indexCandidate;
                    stat = fs.statSync(resolvedPath);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end(`404 Not Found: Directory '${pathname}' does not contain an index.html`);
                    return;
                }
            }
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`404 Not Found: ${pathname}`);
            return;
        }

        const ext = path.extname(resolvedPath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        // HTML files: inject Live Reload script before serving
        if (ext === '.html' || ext === '.htm') {
            try {
                const htmlRaw = fs.readFileSync(resolvedPath, 'utf8');
                const htmlInjected = injectReloadScript(htmlRaw);
                const htmlBuf = Buffer.from(htmlInjected, 'utf8');

                res.writeHead(200, {
                    'Content-Type': mimeType,
                    'Content-Length': htmlBuf.length,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                res.end(htmlBuf);
            } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`500 Internal Server Error: ${err.message}`);
            }
            return;
        }

        // Other assets: stream file with proper MIME type
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': stat.size,
            'Cache-Control': 'no-cache'
        });
        const readStream = fs.createReadStream(resolvedPath);
        readStream.on('error', () => {
            if (!res.headersSent) {
                res.writeHead(500);
            }
            res.end();
        });
        readStream.pipe(res);
    }

    private setupWatchers(rootDirectory: string): void {
        this.disposeWatchers();

        // 1. VS Code document save listener
        this.docSaveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
            if (this.rootDir && doc.uri.fsPath.startsWith(this.rootDir)) {
                this.triggerReload();
            }
        });

        // 2. VS Code File System Watcher for file creation / deletion / edits
        try {
            const pattern = new vscode.RelativePattern(rootDirectory, '**/*');
            this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
            this.fileWatcher.onDidChange(() => this.triggerReload());
            this.fileWatcher.onDidCreate(() => this.triggerReload());
            this.fileWatcher.onDidDelete(() => this.triggerReload());
        } catch {
            // Fallback: document save listener is already active
        }
    }

    private triggerReload(): void {
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
        }
        this.reloadTimer = setTimeout(() => {
            this.broadcastReload();
        }, 120);
    }

    private broadcastReload(): void {
        for (const client of this.clients) {
            try {
                client.write('data: reload\n\n');
            } catch {
                this.clients.delete(client);
            }
        }
    }

    public async stop(showNotification: boolean = true): Promise<void> {
        this.disposeWatchers();

        for (const client of this.clients) {
            try {
                client.end();
            } catch {
                // Ignore errors on closing dead clients
            }
        }
        this.clients.clear();

        if (this.server) {
            await new Promise<void>((resolve) => {
                this.server!.close(() => resolve());
            });
            this.server = undefined;
        }

        this.currentPort = undefined;
        this.rootDir = undefined;
        this.updateContext(false);

        if (this.statusBarItem) {
            this.statusBarItem.hide();
        }

        if (showNotification) {
            vscode.window.showInformationMessage('Universal Run: Live Server stopped.');
        }
    }

    private updateContext(running: boolean): void {
        vscode.commands.executeCommand('setContext', 'universalRunner:liveServerRunning', running);
    }

    private updateStatusBar(port: number): void {
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            this.statusBarItem.command = 'universal-runner.showLiveServerMenu';
        }
        this.statusBarItem.text = `$(radio-tower) Live Server: ${port}`;
        this.statusBarItem.tooltip = `Universal Live Server running at http://127.0.0.1:${port}. Click for options.`;
        this.statusBarItem.show();
    }

    public async showMenu(): Promise<void> {
        if (!this.isRunning()) {
            const choice = await vscode.window.showInformationMessage(
                'Live Server is currently stopped.',
                'Start Live Server',
                'Customize Default HTML Action'
            );
            if (choice === 'Start Live Server') {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    await this.start(editor.document.uri.fsPath);
                }
            } else if (choice === 'Customize Default HTML Action') {
                await configureHtmlAction();
            }
            return;
        }

        const encodedSegments = this.lastRelativePath.split('/').map(encodeURIComponent).join('/');
        const currentUrl = `http://127.0.0.1:${this.currentPort}/${encodedSegments}`;

        const items: (vscode.QuickPickItem & { action: 'browser' | 'stop' | 'config' })[] = [
            {
                label: `$(browser) Open in Browser`,
                description: currentUrl,
                action: 'browser'
            },
            {
                label: `$(debug-stop) Stop Live Server`,
                description: `Stop server on port ${this.currentPort}`,
                action: 'stop'
            },
            {
                label: `$(gear) Customize Default HTML Action...`,
                description: `Change default Play button action (Live Server vs Run Path)`,
                action: 'config'
            }
        ];

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: `Universal Live Server is active on port ${this.currentPort}`
        });

        if (!pick) {
            return;
        }

        if (pick.action === 'browser') {
            await vscode.env.openExternal(vscode.Uri.parse(currentUrl));
        } else if (pick.action === 'stop') {
            await this.stop();
        } else if (pick.action === 'config') {
            await configureHtmlAction();
        }
    }

    private launchCustomCommand(cmd: string, filePath: string): string {
        const terminalName = 'Universal Live Server';
        let term = vscode.window.terminals.find(t => t.name === terminalName);
        if (!term) {
            term = vscode.window.createTerminal(terminalName);
        }
        term.show();

        const fileDir = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const isWindows = process.platform === 'win32';

        const runCmd = isWindows
            ? `Set-Location '${fileDir.replace(/'/g, "''")}'; ${cmd}`
            : `cd '${fileDir.replace(/'/g, "'\\''")}' && ${cmd}`;

        term.sendText(runCmd, true);
        vscode.window.showInformationMessage(`Universal Run: Executing custom Live Server command in terminal.`);
        return `custom:${cmd}`;
    }

    private disposeWatchers(): void {
        if (this.docSaveListener) {
            this.docSaveListener.dispose();
            this.docSaveListener = undefined;
        }
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
            this.reloadTimer = undefined;
        }
    }

    public dispose(): void {
        this.stop(false);
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
            this.statusBarItem = undefined;
        }
    }
}

/**
 * Configure default HTML execution action: Live Server or Run Path (File Path)
 */
export async function configureHtmlAction(): Promise<void> {
    const config = vscode.workspace.getConfiguration('universalRunner');
    const current = config.get<string>('htmlDefaultAction') || 'liveServer';

    const items: (vscode.QuickPickItem & { value: 'liveServer' | 'runPath' | 'prompt' })[] = [
        {
            label: '$(radio-tower) Live Server',
            description: current === 'liveServer' ? '(Current Default) Local server with auto-reload on file save' : 'Local server with auto-reload on file save',
            value: 'liveServer'
        },
        {
            label: '$(browser) Run Path (File Path)',
            description: current === 'runPath' ? '(Current Default) Opens file:/// directly in default web browser' : 'Opens file:/// directly in default web browser',
            value: 'runPath'
        },
        {
            label: '$(question) Prompt Each Time',
            description: current === 'prompt' ? '(Current Default) Show dropdown choice whenever Run is clicked' : 'Show dropdown choice whenever Run is clicked',
            value: 'prompt'
        }
    ];

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select default behavior for the Play button when viewing HTML files'
    });

    if (!selected) {
        return;
    }

    await config.update('htmlDefaultAction', selected.value, vscode.ConfigurationTarget.Global);

    const friendlyName = selected.value === 'liveServer'
        ? 'Live Server'
        : selected.value === 'runPath'
            ? 'Run Path (File Path)'
            : 'Prompt Each Time';

    vscode.window.showInformationMessage(`Universal Run Button: Default HTML action set to '${friendlyName}'.`);
}

