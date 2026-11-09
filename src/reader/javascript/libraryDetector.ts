// Node.js built-in modules
export const NODE_BUILTINS = new Set<string>([
    'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 'constants',
    'crypto', 'dgram', 'diagnostics_channel', 'dns', 'domain', 'events', 'fs', 'fs/promises',
    'http', 'http2', 'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks',
    'process', 'punycode', 'querystring', 'readline', 'repl', 'stream', 'stream/promises',
    'stream/web', 'string_decoder', 'sys', 'timers', 'timers/promises', 'tls', 'trace_events',
    'tty', 'url', 'util', 'util/types', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
]);

export class JavaScriptLibraryDetector {
    public extractImports(sourceCode: string): string[] {
        const results = new Set<string>();

        // 1. ES module imports: import ... from 'package'; import 'package';
        const esmRegex = /^\s*import(?:\s+.*?\s+from\s+|\s+)(?:'([^']+)'|"([^"]+)")/gm;
        let match: RegExpExecArray | null;
        while ((match = esmRegex.exec(sourceCode)) !== null) {
            const raw = match[1] || match[2];
            if (raw) {
                results.add(this.getTopPackageName(raw));
            }
        }

        // 2. CommonJS require: require('package')
        const cjsRegex = /require\s*\(\s*(?:'([^']+)'|"([^"]+)")\s*\)/g;
        while ((match = cjsRegex.exec(sourceCode)) !== null) {
            const raw = match[1] || match[2];
            if (raw) {
                results.add(this.getTopPackageName(raw));
            }
        }

        return Array.from(results);
    }

    private getTopPackageName(importPath: string): string {
        const trimmed = importPath.trim();
        if (trimmed.startsWith('@')) {
            // Scoped npm package: @org/pkg
            const parts = trimmed.split('/');
            return parts.slice(0, 2).join('/');
        }
        return trimmed.split('/')[0];
    }
}

