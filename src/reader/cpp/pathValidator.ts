import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { CppLibraryConfig } from './types';

export interface PathValidationIssue {
    library: string;
    type: 'includePath' | 'libraryPath' | 'libraryFile' | 'runtimePath' | 'compiler';
    path: string;
    message: string;
    configFile: string;
}

export class CppPathValidator {
    /**
     * Verifies that compiler executable exists in PATH or custom path.
     */
    public async validateCompiler(compilerName: string, isWindows: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const probe = `${compilerName} --version`;
            exec(probe, (err) => {
                if (!err) {
                    resolve(true);
                    return;
                }
                const lookup = isWindows ? `where.exe ${compilerName}` : `which ${compilerName}`;
                exec(lookup, (lookupErr) => {
                    resolve(!lookupErr);
                });
            });
        });
    }

    /**
     * Validates that all configured include directories, library directories,
     * and library files exist on disk.
     */
    public validateLibraryPaths(
        lib: CppLibraryConfig,
        configFile: string
    ): PathValidationIssue[] {
        const issues: PathValidationIssue[] = [];

        // 1. Include paths
        if (lib.includePaths) {
            for (const inc of lib.includePaths) {
                if (!fs.existsSync(inc)) {
                    issues.push({
                        library: lib.name,
                        type: 'includePath',
                        path: inc,
                        message: `Include directory does not exist: "${inc}"`,
                        configFile
                    });
                }
            }
        }

        // 2. Library paths
        if (lib.libraryPaths) {
            for (const lp of lib.libraryPaths) {
                if (!fs.existsSync(lp)) {
                    issues.push({
                        library: lib.name,
                        type: 'libraryPath',
                        path: lp,
                        message: `Library directory does not exist: "${lp}"`,
                        configFile
                    });
                }
            }
        }

        // 3. Library files
        if (lib.libraryFiles) {
            for (const lf of lib.libraryFiles) {
                if (!fs.existsSync(lf)) {
                    issues.push({
                        library: lib.name,
                        type: 'libraryFile',
                        path: lf,
                        message: `Library file does not exist: "${lf}"`,
                        configFile
                    });
                }
            }
        }

        return issues;
    }
}

