// Common standard Java root packages
export const JAVA_STANDARD_PACKAGES = new Set<string>([
    'java', 'javax', 'jdk', 'sun', 'com.sun', 'org.w3c.dom', 'org.xml.sax'
]);

export class JavaLibraryDetector {
    public extractImports(sourceCode: string): string[] {
        const results = new Set<string>();
        const importRegex = /^\s*import(?:\s+static)?\s+([a-zA-Z0-9_.]+);/gm;

        let match: RegExpExecArray | null;
        while ((match = importRegex.exec(sourceCode)) !== null) {
            const fullPkg = match[1];
            if (fullPkg) {
                results.add(fullPkg);
            }
        }

        return Array.from(results);
    }
}

