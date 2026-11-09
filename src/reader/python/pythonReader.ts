import * as path from 'path';
import * as fs from 'fs';
import { LanguageReader, BaseReaderResult } from '../types';
import { PythonLibraryDetector, PYTHON_STDLIB } from './libraryDetector';

export class PythonReader implements LanguageReader {
    public readonly id = 'python';
    private detector = new PythonLibraryDetector();

    public canHandle(languageId: string, ext: string): boolean {
        return languageId === 'python' || ext === '.py';
    }

    public async inspectAndPlan(
        filePath: string,
        fileContent: string,
        isWindows: boolean,
        extensionRoot: string,
        customPaths?: Record<string, string>
    ): Promise<BaseReaderResult | undefined> {
        const fileDir = path.dirname(filePath);
        const importedModules = this.detector.extractImports(fileContent);

        // Filter out Python stdlib and local .py files in same directory
        const externalImports: string[] = [];
        for (const mod of importedModules) {
            if (PYTHON_STDLIB.has(mod)) {
                continue;
            }
            const localFile = path.join(fileDir, `${mod}.py`);
            const localDir = path.join(fileDir, mod);
            if (fs.existsSync(localFile) || fs.existsSync(localDir)) {
                continue;
            }
            externalImports.push(mod);
        }

        // Standard execution handled normally by executor.ts
        if (externalImports.length === 0) {
            return undefined;
        }

        return {
            handled: false, // Allows standard python command execution in executor.ts
            language: 'python',
            warningNotice: undefined
        };
    }
}

