import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageReader, BaseReaderResult } from './types';
import { CppReader } from './cpp/cppReader';
import { PythonReader } from './python/pythonReader';
import { JavaScriptReader } from './javascript/javascriptReader';
import { JavaReader } from './java/javaReader';

export class ReaderManager {
    private readers: LanguageReader[] = [];
    private extensionRoot: string;

    constructor(context: vscode.ExtensionContext) {
        this.extensionRoot = context.extensionPath;
        this.readers = [
            new CppReader(),
            new PythonReader(),
            new JavaScriptReader(),
            new JavaReader()
        ];
    }

    public getExtensionRoot(): string {
        return this.extensionRoot;
    }

    /**
     * Inspects active source file through the appropriate reader.
     * Returns undefined if language is not handled by any registered reader.
     */
    public async inspect(
        languageId: string,
        filePath: string,
        fileContent: string,
        isWindows: boolean,
        customPaths?: Record<string, string>
    ): Promise<BaseReaderResult | undefined> {
        const ext = (path.extname(filePath) || '').toLowerCase();
        const reader = this.readers.find(r => r.canHandle(languageId, ext));
        if (!reader) {
            return undefined;
        }

        return await reader.inspectAndPlan(
            filePath,
            fileContent,
            isWindows,
            this.extensionRoot,
            customPaths
        );
    }
}

