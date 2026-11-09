import * as path from 'path';
import * as fs from 'fs';

export interface BaseReaderResult {
    handled: boolean;
    language: string;
    warningNotice?: string;
    missingLibraries?: {
        name: string;
        expectedPath?: string;
        configFile?: string;
        message: string;
    }[];
    commandOverride?: string;
    buildArgs?: {
        compiler: string;
        flags: string[];
        includeDirs: string[];
        libDirs: string[];
        libFiles: string[];
        linkerFlags: string[];
        sources: string[];
        outExe: string;
        workingDir: string;
    };
    executionCommand?: string;
}

export interface LanguageReader {
    readonly id: string;
    canHandle(languageId: string, ext: string): boolean;
    inspectAndPlan(
        filePath: string,
        fileContent: string,
        isWindows: boolean,
        extensionRoot: string,
        customPaths?: Record<string, string>
    ): Promise<BaseReaderResult | undefined>;
}

