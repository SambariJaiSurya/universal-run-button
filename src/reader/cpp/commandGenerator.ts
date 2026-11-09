import * as path from 'path';
import { CppLibraryConfig } from './types';
import { psQuote, posixQuote } from '../../executor';

export interface GeneratedCppPlan {
    command: string;
    outExe: string;
    workingDir: string;
}

export class CppCommandGenerator {
    /**
     * Builds safe compiler & linker execution commands for PowerShell / POSIX.
     * Respects Windows paths, spaces, output directory, and linker flag ordering.
     */
    public generate(params: {
        compiler: string;
        standard?: string;
        sourceFiles: string[];
        outExe: string;
        workingDir: string;
        resolvedLibs: CppLibraryConfig[];
        projectCompilerFlags?: string[];
        projectLinkerFlags?: string[];
        projectIncludePaths?: string[];
        isWindows: boolean;
        outputDirName?: string;
    }): GeneratedCppPlan {
        const {
            compiler,
            standard,
            sourceFiles,
            outExe,
            workingDir,
            resolvedLibs,
            projectCompilerFlags = [],
            projectLinkerFlags = [],
            projectIncludePaths = [],
            isWindows,
            outputDirName = 'build'
        } = params;

        const q = isWindows ? psQuote : posixQuote;

        // 1. Gather all unique include paths (-I)
        const includeSet = new Set<string>();
        for (const inc of projectIncludePaths) {
            includeSet.add(path.normalize(inc));
        }
        for (const lib of resolvedLibs) {
            for (const inc of lib.includePaths || []) {
                includeSet.add(path.normalize(inc));
            }
        }

        // 2. Gather library directories (-L)
        const libDirSet = new Set<string>();
        for (const lib of resolvedLibs) {
            for (const ld of lib.libraryPaths || []) {
                libDirSet.add(path.normalize(ld));
            }
        }

        // 3. Gather static library files (*.a, *.lib)
        const libFileSet = new Set<string>();
        for (const lib of resolvedLibs) {
            for (const lf of lib.libraryFiles || []) {
                libFileSet.add(path.normalize(lf));
            }
        }

        // 4. Gather compiler flags
        const compilerFlags: string[] = [];
        if (standard && standard.trim()) {
            compilerFlags.push(`-std=${standard.trim()}`);
        }
        for (const f of projectCompilerFlags) {
            compilerFlags.push(f);
        }
        for (const lib of resolvedLibs) {
            for (const f of lib.compilerFlags || []) {
                compilerFlags.push(f);
            }
        }

        // 5. Gather linker flags (-l...)
        const linkerFlags: string[] = [];
        for (const f of projectLinkerFlags) {
            linkerFlags.push(f);
        }
        for (const lib of resolvedLibs) {
            for (const f of lib.linkerFlags || []) {
                linkerFlags.push(f);
            }
        }

        // Build command arguments
        const compileArgs: string[] = [];

        // Sources
        for (const src of sourceFiles) {
            compileArgs.push(q(src));
        }

        // Includes
        for (const inc of includeSet) {
            compileArgs.push(`-I${q(inc)}`);
        }

        // Compiler flags
        for (const cf of compilerFlags) {
            compileArgs.push(cf);
        }

        // Library dirs (-L)
        for (const ld of libDirSet) {
            compileArgs.push(`-L${q(ld)}`);
        }

        // Library files
        for (const lf of libFileSet) {
            compileArgs.push(q(lf));
        }

        // Linker flags
        for (const lf of linkerFlags) {
            compileArgs.push(lf);
        }

        // Output flag
        compileArgs.push('-o');
        compileArgs.push(q(outExe));

        const compileCmd = `${compiler} ${compileArgs.join(' ')}`;

        // Build execution string
        let command: string;
        if (isWindows) {
            // Ensure output directory exists if in a subdirectory
            const outDir = path.dirname(outExe);
            const ensureDirCmd = (outDir && outDir !== '.')
                ? `if (!(Test-Path ${q(outDir)})) { New-Item -ItemType Directory -Path ${q(outDir)} -Force | Out-Null }; `
                : '';
            const removeOldCmd = `if (Test-Path ${q(outExe)}) { Remove-Item ${q(outExe)} -Force }; `;
            const runCmd = `& ${q(outExe.startsWith('.\\') || outExe.startsWith('./') ? outExe : '.\\' + outExe)}`;

            command = `Set-Location ${q(workingDir)}; ${ensureDirCmd}${removeOldCmd}${compileCmd}; if ($LASTEXITCODE -eq 0) { ${runCmd} }`;
        } else {
            const outDir = path.dirname(outExe);
            const ensureDirCmd = (outDir && outDir !== '.') ? `mkdir -p ${q(outDir)} && ` : '';
            const removeOldCmd = `rm -f ${q(outExe)} && `;
            const runCmd = outExe.startsWith('./') ? outExe : `./${outExe}`;

            command = `cd ${q(workingDir)} && ${ensureDirCmd}${removeOldCmd}${compileCmd} && ${runCmd}`;
        }

        return {
            command,
            outExe,
            workingDir
        };
    }
}

