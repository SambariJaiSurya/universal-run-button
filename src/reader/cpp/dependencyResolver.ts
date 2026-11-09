import { CppLibraryConfig } from './types';

export interface ResolveResult {
    resolvedLibs: CppLibraryConfig[];
    missingDependencies: string[];
    circularDependencies: string[][];
}

export class CppDependencyResolver {
    /**
     * Recursively resolves library dependencies in topological order.
     * Detects circular dependencies and reports missing dependencies.
     */
    public resolve(
        initialLibs: CppLibraryConfig[],
        allRegistryLibs: Map<string, CppLibraryConfig>
    ): ResolveResult {
        const resolved: CppLibraryConfig[] = [];
        const resolvedNames = new Set<string>();
        const missingDependencies = new Set<string>();
        const circularDependencies: string[][] = [];

        const visiting = new Set<string>();
        const currentPath: string[] = [];

        const visit = (libName: string) => {
            const lib = allRegistryLibs.get(libName);
            if (!lib) {
                missingDependencies.add(libName);
                return;
            }

            if (visiting.has(libName)) {
                // Cycle detected
                const cycle = [...currentPath.slice(currentPath.indexOf(libName)), libName];
                circularDependencies.push(cycle);
                return;
            }

            if (resolvedNames.has(libName)) {
                return;
            }

            visiting.add(libName);
            currentPath.push(libName);

            // Visit dependencies first (dependencies must be linked after dependents in GCC/Clang)
            if (lib.dependencies && Array.isArray(lib.dependencies)) {
                for (const dep of lib.dependencies) {
                    visit(dep);
                }
            }

            currentPath.pop();
            visiting.delete(libName);

            resolvedNames.add(libName);
            resolved.push(lib);
        };

        for (const lib of initialLibs) {
            visit(lib.name);
        }

        return {
            resolvedLibs: resolved,
            missingDependencies: Array.from(missingDependencies),
            circularDependencies
        };
    }
}

