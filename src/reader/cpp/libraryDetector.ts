import * as fs from 'fs';
import * as path from 'path';
import { CppLibraryConfig } from './types';

// Standard C and C++ library headers that must NEVER trigger external library detection
export const STANDARD_CPP_HEADERS = new Set<string>([
    // C++ Standard Library headers
    'algorithm', 'any', 'array', 'atomic', 'barrier', 'bit', 'bitset', 'charconv', 'chrono',
    'compare', 'complex', 'concepts', 'condition_variable', 'coroutine', 'deque', 'exception',
    'execution', 'expected', 'filesystem', 'format', 'forward_list', 'fstream', 'functional',
    'future', 'generator', 'initializer_list', 'iomanip', 'ios', 'iosfwd', 'iostream', 'istream',
    'iterator', 'latch', 'limits', 'list', 'locale', 'map', 'mdspan', 'memory', 'memory_resource',
    'mutex', 'new', 'numbers', 'numeric', 'optional', 'ostream', 'print', 'queue', 'random',
    'ranges', 'ratio', 'regex', 'scoped_allocator', 'semaphore', 'set', 'shared_mutex', 'source_location',
    'span', 'spanstream', 'sstream', 'stack', 'stacktrace', 'stdexcept', 'stdfloat', 'stop_token',
    'streambuf', 'string', 'string_view', 'strstream', 'syncstream', 'system_error', 'thread',
    'tuple', 'typeindex', 'typeinfo', 'type_traits', 'unordered_map', 'unordered_set', 'utility',
    'valarray', 'variant', 'vector', 'version',

    // C Standard Library headers (and their C++ c* variants)
    'assert.h', 'cassert', 'complex.h', 'ccomplex', 'ctype.h', 'cctype', 'errno.h', 'cerrno',
    'fenv.h', 'cfenv', 'float.h', 'cfloat', 'inttypes.h', 'cinttypes', 'iso646.h', 'ciso646',
    'limits.h', 'climits', 'locale.h', 'clocale', 'math.h', 'cmath', 'setjmp.h', 'csetjmp',
    'signal.h', 'csignal', 'stdalign.h', 'cstdalign', 'stdarg.h', 'cstdarg', 'stdbool.h', 'cstdbool',
    'stddef.h', 'cstddef', 'stdint.h', 'cstdint', 'stdio.h', 'cstdio', 'stdlib.h', 'cstdlib',
    'string.h', 'cstring', 'tgmath.h', 'ctgmath', 'threads.h', 'cuchar', 'time.h', 'ctime',
    'uchar.h', 'wchar.h', 'cwchar', 'wctype.h', 'cwctype',

    // Windows / System POSIX headers (common non-library OS headers)
    'windows.h', 'windef.h', 'winbase.h', 'unistd.h', 'sys/types.h', 'sys/stat.h', 'fcntl.h'
]);

export interface DetectedHeader {
    rawHeader: string;
    isAngleBracket: boolean;
    isQuoted: boolean;
}

export class CppLibraryDetector {
    /**
     * Extracts all #include directives from source text,
     * carefully stripping multi-line and single-line comments first.
     */
    public extractIncludes(sourceCode: string): DetectedHeader[] {
        // 1. Strip comments cleanly
        const cleanCode = this.stripComments(sourceCode);

        // 2. Match #include directives
        // Handles: #include <header>, #include "header", #  include  <header>
        const includeRegex = /^\s*#\s*include\s*(<([^>]+)>|"([^"]+)")/gm;
        const results: DetectedHeader[] = [];
        const seen = new Set<string>();

        let match: RegExpExecArray | null;
        while ((match = includeRegex.exec(cleanCode)) !== null) {
            const isAngle = Boolean(match[2]);
            const header = (match[2] || match[3] || '').trim();
            if (header && !seen.has(header.toLowerCase())) {
                seen.add(header.toLowerCase());
                results.push({
                    rawHeader: header,
                    isAngleBracket: isAngle,
                    isQuoted: !isAngle
                });
            }
        }

        return results;
    }

    /**
     * Strips single-line and multi-line comments while preserving quotes.
     */
    private stripComments(source: string): string {
        let insideLineComment = false;
        let insideBlockComment = false;
        let insideString = false;
        let stringChar = '';
        const output: string[] = [];

        for (let i = 0; i < source.length; i++) {
            const ch = source[i];
            const nextCh = i + 1 < source.length ? source[i + 1] : '';

            if (insideLineComment) {
                if (ch === '\n' || ch === '\r') {
                    insideLineComment = false;
                    output.push(ch);
                }
                continue;
            }

            if (insideBlockComment) {
                if (ch === '*' && nextCh === '/') {
                    insideBlockComment = false;
                    i++; // skip /
                }
                continue;
            }

            if (insideString) {
                output.push(ch);
                if (ch === '\\') {
                    // Skip escaped char
                    if (i + 1 < source.length) {
                        output.push(source[++i]);
                    }
                } else if (ch === stringChar) {
                    insideString = false;
                }
                continue;
            }

            // Check transitions
            if (ch === '/' && nextCh === '/') {
                insideLineComment = true;
                i++;
                continue;
            }

            if (ch === '/' && nextCh === '*') {
                insideBlockComment = true;
                i++;
                continue;
            }

            if (ch === '"' || ch === "'") {
                // If it's #include, quotes shouldn't hide the directive, but in typical C++ it's on preprocessor lines
                insideString = true;
                stringChar = ch;
                output.push(ch);
                continue;
            }

            output.push(ch);
        }

        return output.join('');
    }

    /**
     * Filters out standard C/C++ headers and project-local headers.
     * Returns detected external library configs from registry.
     */
    public matchLibraries(
        detectedHeaders: DetectedHeader[],
        sourceFileDir: string,
        registryLibs: CppLibraryConfig[]
    ): {
        matchedLibs: CppLibraryConfig[];
        unknownExternalHeaders: string[];
    } {
        const matchedMap = new Map<string, CppLibraryConfig>();
        const unknown: string[] = [];

        for (const item of detectedHeaders) {
            const header = item.rawHeader;
            const headerLower = header.toLowerCase();

            // 1. Is it a standard standard library or OS header?
            if (STANDARD_CPP_HEADERS.has(headerLower)) {
                continue;
            }

            // 2. Is it a project-local header (exists relative to fileDir)?
            const localPath = path.resolve(sourceFileDir, header);
            if (fs.existsSync(localPath)) {
                continue;
            }

            // 3. Search registered libraries
            let found = false;
            for (const lib of registryLibs) {
                if (lib.headers.some(h => h.toLowerCase() === headerLower)) {
                    matchedMap.set(lib.name, lib);
                    found = true;
                    break;
                }
            }

            // 4. If not found in standard or local or registry, flag as potential unknown external
            if (!found) {
                unknown.push(header);
            }
        }

        return {
            matchedLibs: Array.from(matchedMap.values()),
            unknownExternalHeaders: unknown
        };
    }
}

