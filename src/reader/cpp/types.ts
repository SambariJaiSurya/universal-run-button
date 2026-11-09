export interface CppLibraryConfig {
    name: string;
    headers: string[];
    includePaths: string[];
    libraryPaths: string[];
    libraryFiles: string[];
    runtimePaths?: string[];
    runtimeFiles?: string[];
    compilerFlags?: string[];
    linkerFlags?: string[];
    dependencies?: string[];
    compiler?: string;
    standard?: string;
}

export interface CppSettings {
    defaultCompiler: string;
    defaultStandard: string;
    defaultCCompiler: string;
    defaultCStandard: string;
    outputDirectory: string;
    automaticLibraryDetection: boolean;
    automaticDependencyResolution: boolean;
    validateLibraryPaths: boolean;
    buildCaching: boolean;
    showBuildCommands: boolean;
}

export interface ProjectRunConfig {
    language?: string;
    compiler?: string;
    standard?: string;
    output?: string;
    sourceDirectories?: string[];
    includePaths?: string[];
    libraries?: string[];
    compilerFlags?: string[];
    linkerFlags?: string[];
}

