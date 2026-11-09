// Python standard library module names (do not trigger external detection)
export const PYTHON_STDLIB = new Set<string>([
    'string', 're', 'difflib', 'textwrap', 'unicodedata', 'stringprep', 'readline', 'rlcompleter',
    'struct', 'codecs', 'datetime', 'zoneinfo', 'calendar', 'collections', 'collections.abc',
    'heapq', 'bisect', 'array', 'weakref', 'types', 'copy', 'pprint', 'reprlib', 'enum',
    'graphlib', 'numbers', 'math', 'cmath', 'decimal', 'fractions', 'random', 'statistics',
    'itertools', 'functools', 'operator', 'pathlib', 'os.path', 'fileinput', 'stat', 'filecmp',
    'tempfile', 'glob', 'fnmatch', 'linecache', 'shutil', 'macpath', 'pickle', 'copyreg',
    'shelve', 'marshal', 'dbm', 'sqlite3', 'zlib', 'gzip', 'bz2', 'lzma', 'zipfile', 'tarfile',
    'csv', 'configparser', 'netrc', 'xdrlib', 'plistlib', 'hashlib', 'hmac', 'secrets',
    'os', 'io', 'time', 'argparse', 'getopt', 'logging', 'logging.config', 'logging.handlers',
    'getpass', 'curses', 'platform', 'errno', 'ctypes', 'threading', 'multiprocessing',
    'concurrent.futures', 'subprocess', 'sched', 'queue', 'contextvars', '_thread', 'asyncio',
    'socket', 'ssl', 'select', 'selectors', 'asyncore', 'asynchat', 'signal', 'mmap',
    'email', 'json', 'mailcap', 'mailbox', 'mimetypes', 'base64', 'binhex', 'binascii',
    'quopri', 'uu', 'html', 'html.parser', 'html.entities', 'xml', 'xml.etree.ElementTree',
    'xml.dom', 'xml.sax', 'webbrowser', 'cgi', 'cgitb', 'wsgiref', 'urllib', 'urllib.request',
    'urllib.response', 'urllib.parse', 'urllib.error', 'urllib.robotparser', 'http', 'http.client',
    'http.server', 'http.cookies', 'http.cookiejar', 'ftplib', 'poplib', 'imaplib', 'nntplib',
    'smtplib', 'smtpd', 'telnetlib', 'uuid', 'socketserver', 'xmlrpc', 'ipaddress', 'wave',
    'colorsys', 'turtle', 'cmd', 'shlex', 'tkinter', 'typing', 'pydoc', 'doctest', 'unittest',
    'test', 'sys', 'sysconfig', 'builtins', 'warnings', 'dataclasses', 'contextlib', 'abc',
    'atexit', 'traceback', '__future__', 'gc', 'inspect', 'site', 'code', 'codeop', 'zipimport',
    'pkgutil', 'modulefinder', 'runpy', 'importlib'
]);

export class PythonLibraryDetector {
    public extractImports(sourceCode: string): string[] {
        const results = new Set<string>();
        // Matches: import foo, import foo.bar, from foo import bar
        const importRegex = /^\s*(?:import\s+([a-zA-Z0-9_,\s]+)|from\s+([a-zA-Z0-9_]+)\s+import)/gm;

        let match: RegExpExecArray | null;
        while ((match = importRegex.exec(sourceCode)) !== null) {
            if (match[1]) {
                const parts = match[1].split(',');
                for (const p of parts) {
                    const trimmed = p.trim().split(/\s+/)[0];
                    if (trimmed) {
                        const topLevel = trimmed.split('.')[0];
                        results.add(topLevel);
                    }
                }
            } else if (match[2]) {
                const topLevel = match[2].trim().split('.')[0];
                results.add(topLevel);
            }
        }

        return Array.from(results);
    }
}

