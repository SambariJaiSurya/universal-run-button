import * as path from 'path';
import * as fs from 'fs';
import { LanguageReader, BaseReaderResult } from '../types';
import { JavaScriptLibraryDetector, NODE_BUILTINS } from './libraryDetector';

export class JavaScriptReader implements LanguageReader {
    public readonly id = 'javascript';
    private detector = new JavaScriptLibraryDetector();

    public canHandle(languageId: string, ext: string): boolean {
        return (
            languageId === 'javascript' ||
            ['.js', '.mjs', '.cjs'].includes(ext)
        );
    }

    public async inspectAndPlan(
        filePath: string,
        fileContent: string,
        isWindows: boolean,
        extensionRoot: string,
        customPaths?: Record<string, string>
    ): Promise<BaseReaderResult | undefined> {
        const fileDir = path.dirname(filePath);
        const imported = this.detector.extractImports(fileContent);

        // Filter out Node built-ins and relative paths (starting with . or /)
        const externalPackages: string[] = [];
        for (const pkg of imported) {
            if (pkg.startsWith('.') || pkg.startsWith('/') || pkg.startsWith('\\')) {
                continue; // local relative file
            }
            if (NODE_BUILTINS.has(pkg)) {
                continue; // node built-in
            }
            externalPackages.push(pkg);
        }

        if (externalPackages.length === 0) {
            return undefined; // standard Node runner
        }

        // Return informational notice or allow execution
        return {
            handled: false,
            language: 'javascript'
        };
    }
}

