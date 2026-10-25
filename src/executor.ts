import * as path from 'path';
import * as fs from 'fs';
import { LanguageDefinition } from './registry';

/**
 * Escapes argument for PowerShell single-quoted strings:
 * In PowerShell, single quotes (') are escaped by doubling them ('').
 */
export function psQuote(str: string): string {
    return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Escapes argument for POSIX shells:
 */
export function posixQuote(str: string): string {
    return `'${str.replace(/'/g, "'\\''")}'`;
}

export interface BuildPlan {
    workingDir: string;
    command: string;
    customExecution?: 'markdown-preview' | 'open-browser';
    browserTarget?: string;
    warningNotice?: string;
}

export function buildExecutionPlan(
    lang: LanguageDefinition,
    filePath: string,
    fileContent: string,
    isWindows: boolean,
    customPaths: Record<string, string> = {}
): BuildPlan {
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);

    const q = isWindows ? psQuote : posixQuote;

    // Check special handlings first
    if (lang.executionType === 'web' && (ext.toLowerCase() === '.html' || ext.toLowerCase() === '.htm')) {
        return {
            workingDir: fileDir,
            command: '',
            customExecution: 'open-browser',
            browserTarget: filePath
        };
    }

    if (lang.id === 'markdown') {
        return {
            workingDir: fileDir,
            command: '',
            customExecution: 'markdown-preview'
        };
    }

    if (lang.specialHandlingNotice && (lang.id === 'sql' || lang.id === 'css' || lang.id === 'frontend_framework')) {
        return {
            workingDir: fileDir,
            command: isWindows
                ? `Write-Host "Notice: ${lang.specialHandlingNotice}" -ForegroundColor Yellow`
                : `echo "Notice: ${lang.specialHandlingNotice}"`,
            warningNotice: lang.specialHandlingNotice
        };
    }

    // ---------------------------------------------------------
    // Tier 1 & 2 Specific Languages
    // ---------------------------------------------------------

    // C++
    if (lang.id === 'cpp') {
        const outExe = isWindows ? `${baseName}.exe` : baseName;
        const removeOld = isWindows
            ? `if (Test-Path ${q(outExe)}) { Remove-Item ${q(outExe)} -Force }`
            : `rm -f ${q(outExe)}`;
        const compile = `g++ ${q(fileName)} -o ${q(outExe)}`;
        const run = isWindows ? `& ${q('.\\' + outExe)}` : `./${q(outExe)}`;
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; ${removeOld}; ${compile}; if ($LASTEXITCODE -eq 0) { ${run} }`
            : `cd ${q(fileDir)} && ${removeOld} && ${compile} && ${run}`;
        return { workingDir: fileDir, command };
    }

    // C
    if (lang.id === 'c') {
        const outExe = isWindows ? `${baseName}.exe` : baseName;
        const removeOld = isWindows
            ? `if (Test-Path ${q(outExe)}) { Remove-Item ${q(outExe)} -Force }`
            : `rm -f ${q(outExe)}`;
        const compile = `gcc ${q(fileName)} -o ${q(outExe)}`;
        const run = isWindows ? `& ${q('.\\' + outExe)}` : `./${q(outExe)}`;
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; ${removeOld}; ${compile}; if ($LASTEXITCODE -eq 0) { ${run} }`
            : `cd ${q(fileDir)} && ${removeOld} && ${compile} && ${run}`;
        return { workingDir: fileDir, command };
    }

    // Java
    if (lang.id === 'java') {
        return buildJavaExecution(filePath, fileDir, fileName, baseName, fileContent, isWindows, q);
    }

    // Python
    if (lang.id === 'python') {
        // -u flag for unbuffered output to terminal for real-time prompt display
        const pyCmd = customPaths['python'] || (isWindows ? 'python' : 'python3');
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; & ${q(pyCmd)} -u ${q(fileName)}`
            : `cd ${q(fileDir)} && ${q(pyCmd)} -u ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // JavaScript (Node.js)
    if (lang.id === 'javascript') {
        const nodeCmd = customPaths['node'] || 'node';
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; & ${q(nodeCmd)} ${q(fileName)}`
            : `cd ${q(fileDir)} && ${q(nodeCmd)} ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // TypeScript
    if (lang.id === 'typescript') {
        // Prefer tsx or ts-node if available, or npx tsx
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; npx --yes tsx ${q(fileName)}`
            : `cd ${q(fileDir)} && npx --yes tsx ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // C# (.NET)
    if (lang.id === 'csharp') {
        // Check if there is a .csproj in current or parent directory
        const projectDir = findUpwardsWithFile(fileDir, (f) => f.endsWith('.csproj'));
        if (projectDir) {
            const command = isWindows
                ? `Set-Location ${q(projectDir)}; dotnet run`
                : `cd ${q(projectDir)} && dotnet run`;
            return { workingDir: projectDir, command };
        } else {
            // Standalone C# script or top-level file with dotnet run
            const command = isWindows
                ? `Set-Location ${q(fileDir)}; dotnet run ${q(fileName)}`
                : `cd ${q(fileDir)} && dotnet run ${q(fileName)}`;
            return { workingDir: fileDir, command };
        }
    }

    // Rust
    if (lang.id === 'rust') {
        // Check for Cargo.toml
        const cargoDir = findUpwardsWithFile(fileDir, (f) => f === 'Cargo.toml');
        if (cargoDir) {
            const command = isWindows
                ? `Set-Location ${q(cargoDir)}; cargo run`
                : `cd ${q(cargoDir)} && cargo run`;
            return { workingDir: cargoDir, command };
        } else {
            const outExe = isWindows ? `${baseName}.exe` : baseName;
            const removeOld = isWindows
                ? `if (Test-Path ${q(outExe)}) { Remove-Item ${q(outExe)} -Force }`
                : `rm -f ${q(outExe)}`;
            const compile = `rustc ${q(fileName)} -o ${q(outExe)}`;
            const run = isWindows ? `& ${q('.\\' + outExe)}` : `./${q(outExe)}`;
            const command = isWindows
                ? `Set-Location ${q(fileDir)}; ${removeOld}; ${compile}; if ($LASTEXITCODE -eq 0) { ${run} }`
                : `cd ${q(fileDir)} && ${removeOld} && ${compile} && ${run}`;
            return { workingDir: fileDir, command };
        }
    }

    // Go
    if (lang.id === 'go') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; go run ${q(fileName)}`
            : `cd ${q(fileDir)} && go run ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // PHP
    if (lang.id === 'php') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; php ${q(fileName)}`
            : `cd ${q(fileDir)} && php ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Ruby
    if (lang.id === 'ruby') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; ruby ${q(fileName)}`
            : `cd ${q(fileDir)} && ruby ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // PowerShell
    if (lang.id === 'powershell') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; & ${q('.\\' + fileName)}`
            : `pwsh -File ${q(filePath)}`;
        return { workingDir: fileDir, command };
    }

    // Batch
    if (lang.id === 'batch') {
        const command = `Set-Location ${q(fileDir)}; cmd.exe /c ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Shell / Bash
    if (lang.id === 'shell') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; bash ${q(fileName)}`
            : `cd ${q(fileDir)} && bash ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Kotlin
    if (lang.id === 'kotlin') {
        if (ext === '.kts') {
            const command = isWindows
                ? `Set-Location ${q(fileDir)}; kotlinc -script ${q(fileName)}`
                : `cd ${q(fileDir)} && kotlinc -script ${q(fileName)}`;
            return { workingDir: fileDir, command };
        } else {
            const jarFile = `${baseName}.jar`;
            const removeOld = isWindows
                ? `if (Test-Path ${q(jarFile)}) { Remove-Item ${q(jarFile)} -Force }`
                : `rm -f ${q(jarFile)}`;
            const compile = `kotlinc ${q(fileName)} -include-runtime -d ${q(jarFile)}`;
            const run = `java -jar ${q(jarFile)}`;
            const command = isWindows
                ? `Set-Location ${q(fileDir)}; ${removeOld}; ${compile}; if ($LASTEXITCODE -eq 0) { ${run} }`
                : `cd ${q(fileDir)} && ${removeOld} && ${compile} && ${run}`;
            return { workingDir: fileDir, command };
        }
    }

    // Swift
    if (lang.id === 'swift') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; swift ${q(fileName)}`
            : `cd ${q(fileDir)} && swift ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Dart
    if (lang.id === 'dart') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; dart run ${q(fileName)}`
            : `cd ${q(fileDir)} && dart run ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Julia
    if (lang.id === 'julia') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; julia ${q(fileName)}`
            : `cd ${q(fileDir)} && julia ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // R
    if (lang.id === 'r') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; Rscript ${q(fileName)}`
            : `cd ${q(fileDir)} && Rscript ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Lua
    if (lang.id === 'lua') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; lua ${q(fileName)}`
            : `cd ${q(fileDir)} && lua ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Perl
    if (lang.id === 'perl') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; perl ${q(fileName)}`
            : `cd ${q(fileDir)} && perl ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Zig
    if (lang.id === 'zig') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; zig run ${q(fileName)}`
            : `cd ${q(fileDir)} && zig run ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Nim
    if (lang.id === 'nim') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; nim c -r ${q(fileName)}`
            : `cd ${q(fileDir)} && nim c -r ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // D
    if (lang.id === 'd') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; rdmd ${q(fileName)}`
            : `cd ${q(fileDir)} && rdmd ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Fortran
    if (lang.id === 'fortran') {
        const outExe = isWindows ? `${baseName}.exe` : baseName;
        const removeOld = isWindows
            ? `if (Test-Path ${q(outExe)}) { Remove-Item ${q(outExe)} -Force }`
            : `rm -f ${q(outExe)}`;
        const compile = `gfortran ${q(fileName)} -o ${q(outExe)}`;
        const run = isWindows ? `& ${q('.\\' + outExe)}` : `./${q(outExe)}`;
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; ${removeOld}; ${compile}; if ($LASTEXITCODE -eq 0) { ${run} }`
            : `cd ${q(fileDir)} && ${removeOld} && ${compile} && ${run}`;
        return { workingDir: fileDir, command };
    }

    // Pascal
    if (lang.id === 'pascal') {
        const outExe = isWindows ? `${baseName}.exe` : baseName;
        const removeOld = isWindows
            ? `if (Test-Path ${q(outExe)}) { Remove-Item ${q(outExe)} -Force }`
            : `rm -f ${q(outExe)}`;
        const compile = `fpc ${q(fileName)}`;
        const run = isWindows ? `& ${q('.\\' + outExe)}` : `./${q(outExe)}`;
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; ${removeOld}; ${compile}; if ($LASTEXITCODE -eq 0) { ${run} }`
            : `cd ${q(fileDir)} && ${removeOld} && ${compile} && ${run}`;
        return { workingDir: fileDir, command };
    }

    // Haskell
    if (lang.id === 'haskell') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; runghc ${q(fileName)}`
            : `cd ${q(fileDir)} && runghc ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Scala
    if (lang.id === 'scala') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; scala-cli run ${q(fileName)}`
            : `cd ${q(fileDir)} && scala-cli run ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Clojure
    if (lang.id === 'clojure') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; clojure -M ${q(fileName)}`
            : `cd ${q(fileDir)} && clojure -M ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Elixir
    if (lang.id === 'elixir') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; elixir ${q(fileName)}`
            : `cd ${q(fileDir)} && elixir ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Erlang
    if (lang.id === 'erlang') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; escript ${q(fileName)}`
            : `cd ${q(fileDir)} && escript ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Racket
    if (lang.id === 'racket') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; racket ${q(fileName)}`
            : `cd ${q(fileDir)} && racket ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Common Lisp
    if (lang.id === 'lisp') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; sbcl --script ${q(fileName)}`
            : `cd ${q(fileDir)} && sbcl --script ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Groovy
    if (lang.id === 'groovy') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; groovy ${q(fileName)}`
            : `cd ${q(fileDir)} && groovy ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // F#
    if (lang.id === 'fsharp') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; dotnet fsi ${q(fileName)}`
            : `cd ${q(fileDir)} && dotnet fsi ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // LaTeX
    if (lang.id === 'latex') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; pdflatex -interaction=nonstopmode ${q(fileName)}`
            : `cd ${q(fileDir)} && pdflatex -interaction=nonstopmode ${q(fileName)}`;
        return { workingDir: fileDir, command };
    }

    // Dockerfile
    if (lang.id === 'dockerfile') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; docker build -t local-image:latest .`
            : `cd ${q(fileDir)} && docker build -t local-image:latest .`;
        return { workingDir: fileDir, command };
    }

    // CMake
    if (lang.id === 'cmake') {
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; cmake -B build; if ($LASTEXITCODE -eq 0) { cmake --build build }`
            : `cd ${q(fileDir)} && cmake -B build && cmake --build build`;
        return { workingDir: fileDir, command };
    }

    // CUDA
    if (lang.id === 'cuda') {
        const outExe = isWindows ? `${baseName}.exe` : baseName;
        const removeOld = isWindows
            ? `if (Test-Path ${q(outExe)}) { Remove-Item ${q(outExe)} -Force }`
            : `rm -f ${q(outExe)}`;
        const compile = `nvcc ${q(fileName)} -o ${q(outExe)}`;
        const run = isWindows ? `& ${q('.\\' + outExe)}` : `./${q(outExe)}`;
        const command = isWindows
            ? `Set-Location ${q(fileDir)}; ${removeOld}; ${compile}; if ($LASTEXITCODE -eq 0) { ${run} }`
            : `cd ${q(fileDir)} && ${removeOld} && ${compile} && ${run}`;
        return { workingDir: fileDir, command };
    }

    // Generic fallback for any other registered script or compiled tool
    const primaryTool = lang.requiredTools[0] || 'echo';
    const command = isWindows
        ? `Set-Location ${q(fileDir)}; ${primaryTool} ${q(fileName)}`
        : `cd ${q(fileDir)} && ${primaryTool} ${q(fileName)}`;
    return { workingDir: fileDir, command };
}

function buildJavaExecution(
    filePath: string,
    fileDir: string,
    fileName: string,
    baseName: string,
    fileContent: string,
    isWindows: boolean,
    q: (str: string) => string
): BuildPlan {
    const stripped = fileContent
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/.*/g, ' ');

    let rootDir = fileDir;
    let classQName = baseName;

    const packageMatch = stripped.match(/^\s*package\s+([a-zA-Z0-9_.]+)\s*;/m);
    if (packageMatch) {
        const packageName = packageMatch[1].trim();
        const packageParts = packageName.split('.');
        const expectedRelDir = path.join(...packageParts);
        const normalizedFileDir = path.normalize(fileDir);

        if (normalizedFileDir.endsWith(expectedRelDir)) {
            let currentDir = fileDir;
            for (let i = 0; i < packageParts.length; i++) {
                currentDir = path.dirname(currentDir);
            }
            rootDir = currentDir;
            classQName = `${packageName}.${baseName}`;
        } else {
            rootDir = fileDir;
            classQName = `${packageName}.${baseName}`;
        }
    }

    const classFile = path.join(fileDir, `${baseName}.class`);
    const removeOld = isWindows
        ? `if (Test-Path ${q(classFile)}) { Remove-Item ${q(classFile)} -Force }`
        : `rm -f ${q(classFile)}`;
    const compile = `javac -cp . ${q(filePath)}`;
    const run = `java -cp . ${q(classQName)}`;

    const command = isWindows
        ? `Set-Location ${q(rootDir)}; ${removeOld}; ${compile}; if ($LASTEXITCODE -eq 0) { ${run} }`
        : `cd ${q(rootDir)} && ${removeOld} && ${compile} && ${run}`;

    return { workingDir: rootDir, command };
}

function findUpwardsWithFile(startDir: string, predicate: (name: string) => boolean): string | null {
    let currentDir = startDir;
    while (true) {
        try {
            const files = fs.readdirSync(currentDir);
            if (files.some(predicate)) {
                return currentDir;
            }
        } catch {
            break;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }
    return null;
}
