import * as fs from 'fs';
import * as path from 'path';
import { LanguageReader, BaseReaderResult } from '../types';
import { CppLibraryDetector } from './libraryDetector';
import { CppDependencyResolver } from './dependencyResolver';
import { CppPathValidator } from './pathValidator';
import { CppCommandGenerator } from './commandGenerator';
import { CppLibraryConfig, CppSettings, ProjectRunConfig } from './types';

export class CppReader implements LanguageReader {
    public readonly id = 'cpp';

    private detector = new CppLibraryDetector();
    private resolver = new CppDependencyResolver();
    private validator = new CppPathValidator();
    private generator = new CppCommandGenerator();

    public canHandle(languageId: string, ext: string): boolean {
        const lowerExt = ext.toLowerCase();
        return (
            languageId === 'cpp' ||
            languageId === 'c' ||
            ['.cpp', '.cc', '.cxx', '.c'].includes(lowerExt)
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
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const baseName = path.basename(filePath, ext);
        const isC = ext === '.c' || ext === '.h';

        // 1. Load reader global settings
        const settings = this.loadSettings(extensionRoot);

        // 2. Discover project configuration (.runconfig.json) if present
        const projectConfig = this.findProjectConfig(fileDir);

        // 3. Load all library configs from reader/cpp/registry.json
        const { registryLibs, registryMap } = this.loadRegistry(extensionRoot);

        // 4. Extract headers from source code
        const detectedHeaders = this.detector.extractIncludes(fileContent);

        // 5. Match detected headers against registered libraries
        const { matchedLibs, unknownExternalHeaders } = this.detector.matchLibraries(
            detectedHeaders,
            fileDir,
            registryLibs
        );

        // Incorporate libraries declared explicitly in .runconfig.json
        if (projectConfig?.libraries && Array.isArray(projectConfig.libraries)) {
            for (const libName of projectConfig.libraries) {
                const lib = registryMap.get(libName);
                if (lib && !matchedLibs.some(m => m.name === lib.name)) {
                    matchedLibs.push(lib);
                }
            }
        }

        // 6. If no external libraries matched AND no project config, let existing runner handle single file
        // Unless automatic detection found an unknown external library we should inform the user about
        if (matchedLibs.length === 0 && !projectConfig) {
            if (unknownExternalHeaders.length > 0 && settings.automaticLibraryDetection) {
                // If there are unknown headers that are not standard headers, we can return informational warning
                return {
                    handled: false,
                    language: isC ? 'c' : 'cpp',
                    warningNotice: `Universal Run: Detected header(s) [${unknownExternalHeaders.join(', ')}] not found in registry. Running with standard ${isC ? 'gcc' : 'g++'}.`
                };
            }
            return undefined; // Handled by standard executor
        }

        // 7. Resolve dependencies recursively
        const resolveResult = this.resolver.resolve(matchedLibs, registryMap);

        if (resolveResult.circularDependencies.length > 0) {
            const cycles = resolveResult.circularDependencies.map(c => c.join(' -> ')).join('; ');
            return {
                handled: true,
                language: isC ? 'c' : 'cpp',
                missingLibraries: [{
                    name: 'Circular Dependency',
                    message: `Circular dependency detected in C++ libraries: ${cycles}`
                }]
            };
        }

        if (resolveResult.missingDependencies.length > 0) {
            return {
                handled: true,
                language: isC ? 'c' : 'cpp',
                missingLibraries: resolveResult.missingDependencies.map(dep => ({
                    name: dep,
                    message: `Required library dependency '${dep}' is not registered in reader/cpp/registry.json.`
                }))
            };
        }

        // 8. Validate paths for each resolved library
        if (settings.validateLibraryPaths) {
            for (const lib of resolveResult.resolvedLibs) {
                const configFile = path.join(extensionRoot, 'reader', 'cpp', 'libraries', `${lib.name}.json`);
                const issues = this.validator.validateLibraryPaths(lib, configFile);
                if (issues.length > 0) {
                    return {
                        handled: true,
                        language: isC ? 'c' : 'cpp',
                        missingLibraries: issues.map(iss => ({
                            name: iss.library,
                            expectedPath: iss.path,
                            configFile: iss.configFile,
                            message: `${iss.library} configuration error: ${iss.message}`
                        }))
                    };
                }
            }
        }

        // 9. Determine compiler and standard
        let compiler = isC
            ? (settings.defaultCCompiler || 'gcc')
            : (settings.defaultCompiler || 'g++');

        if (customPaths && customPaths[compiler]) {
            compiler = customPaths[compiler];
        }

        if (projectConfig?.compiler) {
            compiler = projectConfig.compiler;
        }

        let standard = isC
            ? (settings.defaultCStandard || 'c11')
            : (settings.defaultStandard || 'c++17');

        if (projectConfig?.standard) {
            standard = projectConfig.standard;
        }

        // 10. Determine source files to compile
        let sourceFiles = [fileName];
        let workingDir = fileDir;

        if (projectConfig?.sourceDirectories && Array.isArray(projectConfig.sourceDirectories)) {
            const projDir = path.dirname(this.findProjectConfigFile(fileDir) || fileDir);
            workingDir = projDir;
            const collected: string[] = [];
            for (const sDir of projectConfig.sourceDirectories) {
                const fullDir = path.resolve(projDir, sDir);
                if (fs.existsSync(fullDir)) {
                    const entries = fs.readdirSync(fullDir);
                    for (const entry of entries) {
                        const sExt = path.extname(entry).toLowerCase();
                        if ((isC && sExt === '.c') || (!isC && ['.cpp', '.cc', '.cxx'].includes(sExt))) {
                            collected.push(path.relative(projDir, path.join(fullDir, entry)));
                        }
                    }
                }
            }
            if (collected.length > 0) {
                sourceFiles = collected;
            }
        }

        // Output executable path
        const outDirName = (settings.outputDirectory && settings.outputDirectory.trim()) ? settings.outputDirectory.trim() : '';
        const outExeName = projectConfig?.output || (isWindows ? `${baseName}.exe` : baseName);
        const outExe = outDirName ? path.join(outDirName, outExeName) : outExeName;

        // 11. Generate command plan
        const generated = this.generator.generate({
            compiler,
            standard,
            sourceFiles,
            outExe,
            workingDir,
            resolvedLibs: resolveResult.resolvedLibs,
            projectCompilerFlags: projectConfig?.compilerFlags,
            projectLinkerFlags: projectConfig?.linkerFlags,
            projectIncludePaths: projectConfig?.includePaths,
            isWindows,
            outputDirName: outDirName
        });

        return {
            handled: true,
            language: isC ? 'c' : 'cpp',
            commandOverride: generated.command,
            buildArgs: {
                compiler,
                flags: [standard ? `-std=${standard}` : ''],
                includeDirs: [],
                libDirs: [],
                libFiles: [],
                linkerFlags: [],
                sources: sourceFiles,
                outExe: generated.outExe,
                workingDir: generated.workingDir
            }
        };
    }

    private loadSettings(extensionRoot: string): CppSettings {
        const settingsPath = path.join(extensionRoot, 'reader', 'cpp', 'settings.json');
        const fallback: CppSettings = {
            defaultCompiler: 'g++',
            defaultStandard: 'c++17',
            defaultCCompiler: 'gcc',
            defaultCStandard: 'c11',
            outputDirectory: '',
            automaticLibraryDetection: true,
            automaticDependencyResolution: true,
            validateLibraryPaths: true,
            buildCaching: true,
            showBuildCommands: false
        };

        if (fs.existsSync(settingsPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                return { ...fallback, ...data };
            } catch {
                return fallback;
            }
        }
        return fallback;
    }

    private loadRegistry(extensionRoot: string): {
        registryLibs: CppLibraryConfig[];
        registryMap: Map<string, CppLibraryConfig>;
    } {
        const registryPath = path.join(extensionRoot, 'reader', 'cpp', 'registry.json');
        const libsDir = path.join(extensionRoot, 'reader', 'cpp', 'libraries');
        const registryLibs: CppLibraryConfig[] = [];
        const registryMap = new Map<string, CppLibraryConfig>();

        if (!fs.existsSync(registryPath)) {
            return { registryLibs, registryMap };
        }

        try {
            const raw = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
            const names: string[] = raw.libraries || [];

            for (const name of names) {
                const configPath = path.join(libsDir, `${name}.json`);
                if (fs.existsSync(configPath)) {
                    try {
                        const libConfig: CppLibraryConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        registryLibs.push(libConfig);
                        registryMap.set(libConfig.name, libConfig);
                    } catch (e) {
                        console.error(`Error parsing library config ${configPath}:`, e);
                    }
                }
            }
        } catch (e) {
            console.error(`Error parsing registry file ${registryPath}:`, e);
        }

        return { registryLibs, registryMap };
    }

    private findProjectConfig(startDir: string): ProjectRunConfig | undefined {
        const cfgFile = this.findProjectConfigFile(startDir);
        if (cfgFile && fs.existsSync(cfgFile)) {
            try {
                return JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
            } catch {
                return undefined;
            }
        }
        return undefined;
    }

    private findProjectConfigFile(startDir: string): string | undefined {
        let current = startDir;
        while (true) {
            const target = path.join(current, '.runconfig.json');
            if (fs.existsSync(target)) {
                return target;
            }
            const parent = path.dirname(current);
            if (!parent || parent === current) {
                break;
            }
            current = parent;
        }
        return undefined;
    }
}

