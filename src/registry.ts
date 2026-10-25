export type ExecutionType = 'compiled' | 'script' | 'special' | 'web';

export interface LanguageDefinition {
    id: string;
    name: string;
    tier: 1 | 2 | 3;
    extensions: string[];
    filenames?: string[];
    // Commands to check in PATH or settings
    requiredTools: string[];
    // Custom tool resolution or default command names
    defaultToolExecutable?: string;
    // Guidance if tool missing
    installGuidance: string;
    executionType: ExecutionType;
    specialHandlingNotice?: string;
}

export const LANGUAGE_REGISTRY: LanguageDefinition[] = [
    // -------------------------------------------------------------
    // TIER 1: Common Core Languages
    // -------------------------------------------------------------
    {
        id: 'c',
        name: 'C',
        tier: 1,
        extensions: ['.c'],
        requiredTools: ['gcc'],
        installGuidance: 'Please install GCC (e.g. MinGW-w64 / MSYS2 on Windows, Xcode on macOS, build-essential on Linux).',
        executionType: 'compiled'
    },
    {
        id: 'cpp',
        name: 'C++',
        tier: 1,
        extensions: ['.cpp', '.cc', '.cxx'],
        requiredTools: ['g++'],
        installGuidance: 'Please install G++ (e.g. MinGW-w64 / MSYS2 on Windows, Xcode on macOS, build-essential on Linux).',
        executionType: 'compiled'
    },
    {
        id: 'java',
        name: 'Java',
        tier: 1,
        extensions: ['.java'],
        requiredTools: ['javac', 'java'],
        installGuidance: 'Please install JDK (Java Development Kit, e.g. OpenJDK or Microsoft Build of OpenJDK) and ensure javac and java are on PATH.',
        executionType: 'compiled'
    },
    {
        id: 'python',
        name: 'Python',
        tier: 1,
        extensions: ['.py'],
        requiredTools: ['python'],
        installGuidance: 'Please install Python from python.org and ensure python (or py) is on PATH.',
        executionType: 'script'
    },
    {
        id: 'javascript',
        name: 'JavaScript (Node.js)',
        tier: 1,
        extensions: ['.js', '.mjs', '.cjs'],
        requiredTools: ['node'],
        installGuidance: 'Please install Node.js from nodejs.org and ensure node is on PATH.',
        executionType: 'script'
    },
    {
        id: 'csharp',
        name: 'C#',
        tier: 1,
        extensions: ['.cs'],
        requiredTools: ['dotnet'],
        installGuidance: 'Please install the .NET SDK from dotnet.microsoft.com and ensure dotnet is on PATH.',
        executionType: 'compiled'
    },
    {
        id: 'go',
        name: 'Go',
        tier: 1,
        extensions: ['.go'],
        requiredTools: ['go'],
        installGuidance: 'Please install Go from go.dev and ensure go is on PATH.',
        executionType: 'compiled'
    },
    {
        id: 'rust',
        name: 'Rust',
        tier: 1,
        extensions: ['.rs'],
        requiredTools: ['rustc'],
        installGuidance: 'Please install Rust via rustup.rs and ensure rustc is configured in your toolchain.',
        executionType: 'compiled'
    },
    {
        id: 'php',
        name: 'PHP',
        tier: 1,
        extensions: ['.php'],
        requiredTools: ['php'],
        installGuidance: 'Please install PHP from php.net and add php to your system PATH.',
        executionType: 'script'
    },
    {
        id: 'ruby',
        name: 'Ruby',
        tier: 1,
        extensions: ['.rb'],
        requiredTools: ['ruby'],
        installGuidance: 'Please install Ruby from ruby-lang.org (or RubyInstaller on Windows) and add ruby to PATH.',
        executionType: 'script'
    },
    {
        id: 'powershell',
        name: 'PowerShell',
        tier: 1,
        extensions: ['.ps1', '.psm1'],
        requiredTools: ['powershell'],
        installGuidance: 'PowerShell is built into Windows or available as PowerShell Core (pwsh).',
        executionType: 'script'
    },
    {
        id: 'batch',
        name: 'Windows Batch',
        tier: 1,
        extensions: ['.bat', '.cmd'],
        requiredTools: ['cmd'],
        installGuidance: 'Windows Command Prompt (cmd.exe) is standard on Windows.',
        executionType: 'script'
    },
    {
        id: 'shell',
        name: 'Shell / Bash',
        tier: 1,
        extensions: ['.sh', '.bash'],
        requiredTools: ['bash'],
        installGuidance: 'Please install Git Bash, WSL, MSYS2, or run on a Unix/macOS environment with bash.',
        executionType: 'script'
    },

    // -------------------------------------------------------------
    // TIER 2: Secondary & Modern Languages
    // -------------------------------------------------------------
    {
        id: 'typescript',
        name: 'TypeScript',
        tier: 2,
        extensions: ['.ts'],
        requiredTools: ['node'], // will probe tsx, ts-node, or tsc
        installGuidance: 'Please install tsx or ts-node (`npm install -g tsx` or `npm install -g ts-node`) or Node.js with TypeScript support.',
        executionType: 'script'
    },
    {
        id: 'kotlin',
        name: 'Kotlin',
        tier: 2,
        extensions: ['.kt', '.kts'],
        requiredTools: ['kotlinc', 'java'],
        installGuidance: 'Please install Kotlin compiler (kotlinc) and JDK from kotlinlang.org.',
        executionType: 'compiled'
    },
    {
        id: 'swift',
        name: 'Swift',
        tier: 2,
        extensions: ['.swift'],
        requiredTools: ['swift'],
        installGuidance: 'Please install Swift toolchain from swift.org or Xcode on macOS.',
        executionType: 'compiled'
    },
    {
        id: 'dart',
        name: 'Dart',
        tier: 2,
        extensions: ['.dart'],
        requiredTools: ['dart'],
        installGuidance: 'Please install Dart SDK from dart.dev or Flutter SDK.',
        executionType: 'script'
    },
    {
        id: 'julia',
        name: 'Julia',
        tier: 2,
        extensions: ['.jl'],
        requiredTools: ['julia'],
        installGuidance: 'Please install Julia from julialang.org and ensure julia is on PATH.',
        executionType: 'script'
    },
    {
        id: 'r',
        name: 'R',
        tier: 2,
        extensions: ['.r', '.R'],
        requiredTools: ['Rscript'],
        installGuidance: 'Please install R from r-project.org and add Rscript to PATH.',
        executionType: 'script'
    },
    {
        id: 'lua',
        name: 'Lua',
        tier: 2,
        extensions: ['.lua'],
        requiredTools: ['lua'],
        installGuidance: 'Please install Lua from lua.org and add lua to PATH.',
        executionType: 'script'
    },
    {
        id: 'perl',
        name: 'Perl',
        tier: 2,
        extensions: ['.pl', '.pm'],
        requiredTools: ['perl'],
        installGuidance: 'Please install Perl (e.g. Strawberry Perl on Windows) and ensure perl is on PATH.',
        executionType: 'script'
    },
    {
        id: 'scala',
        name: 'Scala',
        tier: 2,
        extensions: ['.scala'],
        requiredTools: ['scala'],
        installGuidance: 'Please install Scala CLI or Scala from scala-lang.org.',
        executionType: 'compiled'
    },
    {
        id: 'zig',
        name: 'Zig',
        tier: 2,
        extensions: ['.zig'],
        requiredTools: ['zig'],
        installGuidance: 'Please install Zig from ziglang.org and add zig to PATH.',
        executionType: 'compiled'
    },
    {
        id: 'nim',
        name: 'Nim',
        tier: 2,
        extensions: ['.nim'],
        requiredTools: ['nim'],
        installGuidance: 'Please install Nim from nim-lang.org and add nim to PATH.',
        executionType: 'compiled'
    },
    {
        id: 'crystal',
        name: 'Crystal',
        tier: 2,
        extensions: ['.cr'],
        requiredTools: ['crystal'],
        installGuidance: 'Please install Crystal from crystal-lang.org.',
        executionType: 'compiled'
    },
    {
        id: 'd',
        name: 'D',
        tier: 2,
        extensions: ['.d'],
        requiredTools: ['dmd'],
        installGuidance: 'Please install DMD / LDC compiler from dlang.org.',
        executionType: 'compiled'
    },
    {
        id: 'odin',
        name: 'Odin',
        tier: 2,
        extensions: ['.odin'],
        requiredTools: ['odin'],
        installGuidance: 'Please install Odin compiler from odin-lang.org.',
        executionType: 'compiled'
    },
    {
        id: 'v',
        name: 'V',
        tier: 2,
        extensions: ['.v'],
        requiredTools: ['v'],
        installGuidance: 'Please install V from vlang.io and add v to PATH.',
        executionType: 'compiled'
    },
    {
        id: 'fortran',
        name: 'Fortran',
        tier: 2,
        extensions: ['.f', '.for', '.f90', '.f95', '.f03', '.f08'],
        requiredTools: ['gfortran'],
        installGuidance: 'Please install GFortran (part of GCC/MinGW) and add gfortran to PATH.',
        executionType: 'compiled'
    },
    {
        id: 'pascal',
        name: 'Pascal / Delphi',
        tier: 2,
        extensions: ['.pas', '.pp', '.dpr'],
        requiredTools: ['fpc'],
        installGuidance: 'Please install Free Pascal Compiler (fpc) from freepascal.org.',
        executionType: 'compiled'
    },
    {
        id: 'haskell',
        name: 'Haskell',
        tier: 2,
        extensions: ['.hs', '.lhs'],
        requiredTools: ['runghc'],
        installGuidance: 'Please install GHC / GHCup from haskell.org/ghcup and add runghc / ghc to PATH.',
        executionType: 'script'
    },
    {
        id: 'ocaml',
        name: 'OCaml',
        tier: 2,
        extensions: ['.ml', '.mli'],
        requiredTools: ['ocaml'],
        installGuidance: 'Please install OCaml via opam or official installer.',
        executionType: 'script'
    },
    {
        id: 'clojure',
        name: 'Clojure',
        tier: 2,
        extensions: ['.clj', '.cljs', '.cljc'],
        requiredTools: ['clojure'],
        installGuidance: 'Please install Clojure CLI tools from clojure.org.',
        executionType: 'script'
    },
    {
        id: 'elixir',
        name: 'Elixir',
        tier: 2,
        extensions: ['.ex', '.exs'],
        requiredTools: ['elixir'],
        installGuidance: 'Please install Elixir and Erlang from elixir-lang.org.',
        executionType: 'script'
    },
    {
        id: 'erlang',
        name: 'Erlang',
        tier: 2,
        extensions: ['.erl'],
        requiredTools: ['escript'],
        installGuidance: 'Please install Erlang/OTP from erlang.org.',
        executionType: 'script'
    },
    {
        id: 'racket',
        name: 'Racket / Scheme',
        tier: 2,
        extensions: ['.rkt', '.scm', '.ss'],
        requiredTools: ['racket'],
        installGuidance: 'Please install Racket from racket-lang.org.',
        executionType: 'script'
    },
    {
        id: 'lisp',
        name: 'Common Lisp',
        tier: 2,
        extensions: ['.lisp', '.lsp'],
        requiredTools: ['sbcl'],
        installGuidance: 'Please install Steel Bank Common Lisp (sbcl) from sbcl.org.',
        executionType: 'script'
    },
    {
        id: 'groovy',
        name: 'Groovy',
        tier: 2,
        extensions: ['.groovy'],
        requiredTools: ['groovy'],
        installGuidance: 'Please install Apache Groovy from groovy-lang.org.',
        executionType: 'script'
    },
    {
        id: 'fsharp',
        name: 'F#',
        tier: 2,
        extensions: ['.fs', '.fsx'],
        requiredTools: ['dotnet'],
        installGuidance: 'Please install .NET SDK from dotnet.microsoft.com (`dotnet fsi` executes F# scripts).',
        executionType: 'script'
    },
    {
        id: 'vb',
        name: 'Visual Basic .NET',
        tier: 2,
        extensions: ['.vb'],
        requiredTools: ['dotnet'],
        installGuidance: 'Please install .NET SDK from dotnet.microsoft.com to build and run VB.NET projects.',
        executionType: 'compiled'
    },
    {
        id: 'raku',
        name: 'Raku',
        tier: 2,
        extensions: ['.raku', '.rakumod'],
        requiredTools: ['raku'],
        installGuidance: 'Please install Rakudo Raku from rakudo.org.',
        executionType: 'script'
    },
    {
        id: 'awk',
        name: 'AWK',
        tier: 2,
        extensions: ['.awk'],
        requiredTools: ['gawk'],
        installGuidance: 'Please install gawk / awk (via MSYS2 or package manager).',
        executionType: 'script'
    },
    {
        id: 'autohotkey',
        name: 'AutoHotkey',
        tier: 2,
        extensions: ['.ahk'],
        requiredTools: ['AutoHotkey.exe'],
        installGuidance: 'Please install AutoHotkey from autohotkey.com.',
        executionType: 'script'
    },
    {
        id: 'nushell',
        name: 'Nushell',
        tier: 2,
        extensions: ['.nu'],
        requiredTools: ['nu'],
        installGuidance: 'Please install Nushell from nushell.sh.',
        executionType: 'script'
    },

    // -------------------------------------------------------------
    // TIER 3 & SPECIAL HANDLING
    // -------------------------------------------------------------
    {
        id: 'html',
        name: 'HTML',
        tier: 3,
        extensions: ['.html', '.htm'],
        requiredTools: [],
        installGuidance: '',
        executionType: 'web',
        specialHandlingNotice: 'HTML file opened in your default web browser.'
    },
    {
        id: 'markdown',
        name: 'Markdown',
        tier: 3,
        extensions: ['.md', '.markdown'],
        requiredTools: [],
        installGuidance: '',
        executionType: 'special',
        specialHandlingNotice: 'Markdown is a documentation format. Opening built-in Markdown Preview...'
    },
    {
        id: 'sql',
        name: 'SQL',
        tier: 3,
        extensions: ['.sql'],
        requiredTools: [],
        installGuidance: 'SQL scripts require an active database connection (e.g. PostgreSQL, MySQL, SQLite, or SQLTools extension).',
        executionType: 'special',
        specialHandlingNotice: 'SQL scripts require a configured database connection.'
    },
    {
        id: 'css',
        name: 'CSS / SCSS / Sass / Less',
        tier: 3,
        extensions: ['.css', '.scss', '.sass', '.less'],
        requiredTools: [],
        installGuidance: 'Stylesheet files are rendered through an HTML page or compiled using sass/less.',
        executionType: 'special',
        specialHandlingNotice: 'Stylesheet files should be linked to an HTML document or compiled with Sass/Less.'
    },
    {
        id: 'frontend_framework',
        name: 'Frontend Framework (React / Vue / Svelte / Astro)',
        tier: 3,
        extensions: ['.jsx', '.tsx', '.vue', '.svelte', '.astro'],
        requiredTools: ['npm'],
        installGuidance: 'Component files require a frontend build tool (Vite, Next.js, Nuxt, SvelteKit, or Astro). Run `npm run dev` in the project root.',
        executionType: 'special',
        specialHandlingNotice: 'Component files require a frontend dev server (e.g. Vite, Next.js). Use `npm run dev` in your project root.'
    },
    {
        id: 'latex',
        name: 'LaTeX',
        tier: 3,
        extensions: ['.tex'],
        requiredTools: ['pdflatex'],
        installGuidance: 'Please install a LaTeX distribution such as TeX Live or MiKTeX.',
        executionType: 'compiled'
    },
    {
        id: 'dockerfile',
        name: 'Dockerfile',
        tier: 3,
        extensions: [],
        filenames: ['Dockerfile', 'dockerfile'],
        requiredTools: ['docker'],
        installGuidance: 'Please install Docker Desktop and ensure docker is on PATH.',
        executionType: 'special',
        specialHandlingNotice: 'Building Docker image from Dockerfile...'
    },
    {
        id: 'cmake',
        name: 'CMake',
        tier: 3,
        extensions: ['.cmake'],
        filenames: ['CMakeLists.txt'],
        requiredTools: ['cmake'],
        installGuidance: 'Please install CMake from cmake.org and add cmake to PATH.',
        executionType: 'special',
        specialHandlingNotice: 'Configuring project with CMake...'
    },
    {
        id: 'arduino',
        name: 'Arduino Sketch',
        tier: 3,
        extensions: ['.ino'],
        requiredTools: ['arduino-cli'],
        installGuidance: 'Please install Arduino CLI or Arduino IDE from arduino.cc.',
        executionType: 'special',
        specialHandlingNotice: 'Arduino sketches require board configuration and arduino-cli.'
    },
    {
        id: 'cuda',
        name: 'CUDA C/C++',
        tier: 3,
        extensions: ['.cu', '.cuh'],
        requiredTools: ['nvcc'],
        installGuidance: 'Please install NVIDIA CUDA Toolkit and ensure nvcc is on PATH.',
        executionType: 'compiled'
    },
    {
        id: 'solidity',
        name: 'Solidity',
        tier: 3,
        extensions: ['.sol'],
        requiredTools: ['solc'],
        installGuidance: 'Please install Solidity compiler (solc) or use Hardhat/Foundry.',
        executionType: 'special',
        specialHandlingNotice: 'Solidity contracts require a framework like Hardhat, Foundry, or solc compiler.'
    },
    {
        id: 'gdscript',
        name: 'Godot GDScript',
        tier: 3,
        extensions: ['.gd'],
        requiredTools: ['godot'],
        installGuidance: 'Please install Godot Engine and add godot executable to PATH.',
        executionType: 'special',
        specialHandlingNotice: 'GDScript requires the Godot engine executable to run.'
    }
];

export function findLanguageForFile(filePath: string): LanguageDefinition | undefined {
    const fileName = filePath.split(/[\\/]/).pop() || '';
    const ext = (fileName.includes('.') ? '.' + fileName.split('.').pop() : '').toLowerCase();

    // 1. Check exact filenames (e.g. Dockerfile, CMakeLists.txt)
    for (const lang of LANGUAGE_REGISTRY) {
        if (lang.filenames && lang.filenames.some(f => f.toLowerCase() === fileName.toLowerCase())) {
            return lang;
        }
    }

    // 2. Check extensions
    for (const lang of LANGUAGE_REGISTRY) {
        if (lang.extensions.some(e => e.toLowerCase() === ext)) {
            return lang;
        }
    }

    return undefined;
}
