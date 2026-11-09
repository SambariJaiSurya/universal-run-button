import * as path from 'path';
import * as fs from 'fs';
import { LanguageReader, BaseReaderResult } from '../types';
import { JavaLibraryDetector, JAVA_STANDARD_PACKAGES } from './libraryDetector';

export class JavaReader implements LanguageReader {
    public readonly id = 'java';
    private detector = new JavaLibraryDetector();

    public canHandle(languageId: string, ext: string): boolean {
        return languageId === 'java' || ext === '.java';
    }

    public async inspectAndPlan(
        filePath: string,
        fileContent: string,
        isWindows: boolean,
        extensionRoot: string,
        customPaths?: Record<string, string>
    ): Promise<BaseReaderResult | undefined> {
        const fileDir = path.dirname(filePath);
        const imports = this.detector.extractImports(fileContent);

        // Filter out standard java packages
        const externalImports: string[] = [];
        for (const imp of imports) {
            const rootPkg = imp.split('.')[0];
            const firstTwo = imp.split('.').slice(0, 2).join('.');
            if (JAVA_STANDARD_PACKAGES.has(rootPkg) || JAVA_STANDARD_PACKAGES.has(firstTwo)) {
                continue;
            }
            externalImports.push(imp);
        }

        if (externalImports.length === 0) {
            return undefined; // Standard Java compiler/runner
        }

        return {
            handled: false,
            language: 'java'
        };
    }
}

