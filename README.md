# 🚀 Universal Run Button for VS Code

<div align="center">

[![Visual Studio Code](https://img.shields.io/badge/VS%20Code-v1.80.0+-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/Built%20With-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/SambariJaiSurya/universal-run-button)
[![GitHub stars](https://img.shields.io/github/stars/SambariJaiSurya/universal-run-button?style=social)](https://github.com/SambariJaiSurya/universal-run-button)

**Compile, interpret, or preview over 50+ programming languages with a single click.**

</div>

---

## 💡 Overview

**Universal Run Button** brings the seamless one-click **▶ Run** experience (popularized by extensions like Python) to **C, C++, Java, Rust, Go, Python, JavaScript, TypeScript, and 50+ other languages**.

When you open any supported source file, a **▶** button appears in the top-right toolbar of the editor. Clicking it saves your code, validates your toolchain, and runs the program directly inside the **integrated VS Code terminal** — preserving full interactive terminal input (`cin`, `scanf`, `Scanner`, etc.).

---

## ✨ Features

- **🎯 Dynamic Active File Detection**: Never hardcodes filenames (`main.cpp`, `main.c`, `Main.java`). It always executes the currently active editor file.
- **🛡️ Stale Binary Prevention**: Deletes prior executables or `.class` files before building. If your compilation fails, older binaries will **never** accidentally run.
- **📁 Safe Path & Space Handling**: Handles directory paths and file names containing spaces (e.g. `Robot Battle.cpp` or nested folders).
- **📦 Package-Aware Java Support**: Analyzes package definitions, adjusts the classpath, and runs fully-qualified classes automatically.
- **🏗️ Project-Aware Execution**:
  - **Rust**: Automatically detects `Cargo.toml` and executes `cargo run`, or falls back to `rustc` for standalone files.
  - **C#**: Detects `.csproj` projects and executes `dotnet run`.
- **⌨️ Interactive Standard Input**: Runs inside your active VS Code terminal, allowing user input via keyboard for interactive programs.
- **🔍 Pre-Flight Toolchain Checks**: Checks if the required compiler or interpreter is present in your PATH before running and prints clear setup instructions if missing.
- **⚙️ Custom Tool Paths**: Point directly to custom compiler or runtime binaries via VS Code settings.

---

## 🗺️ Supported Languages & Runtimes

The extension organizes language execution into three clear tiers:

### 🥇 Tier 1: Core Languages

| Language | File Extensions | Default Compiler / Runner |
|---|---|---|
| **C** | `.c` | `gcc <file> -o <file>.exe; .\<file>.exe` |
| **C++** | `.cpp`, `.cc`, `.cxx` | `g++ <file> -o <file>.exe; .\<file>.exe` |
| **Java** | `.java` | `javac -cp . <file>; java -cp . <class>` |
| **Python** | `.py` | `python -u <file>` |
| **JavaScript** | `.js`, `.mjs`, `.cjs` | `node <file>` |
| **C#** | `.cs` | `dotnet run` (Project or single-file) |
| **Rust** | `.rs` | `cargo run` (if `Cargo.toml`) or `rustc` |
| **Go** | `.go` | `go run <file>` |
| **PHP** | `.php` | `php <file>` |
| **Ruby** | `.rb` | `ruby <file>` |
| **PowerShell** | `.ps1`, `.psm1` | `& .\<file>.ps1` |
| **Windows Batch** | `.bat`, `.cmd` | `cmd.exe /c <file>` |
| **Bash / Shell** | `.sh`, `.bash` | `bash <file>` |

### 🥈 Tier 2: Modern & Extended Languages

| Language | File Extensions | Default Compiler / Runner |
|---|---|---|
| **TypeScript** | `.ts` | `npx --yes tsx <file>` |
| **Kotlin** | `.kt`, `.kts` | `kotlinc` / `kotlinc -script` |
| **Swift** | `.swift` | `swift <file>` |
| **Dart** | `.dart` | `dart run <file>` |
| **Julia** | `.jl` | `julia <file>` |
| **R** | `.r`, `.R` | `Rscript <file>` |
| **Lua** | `.lua` | `lua <file>` |
| **Perl** | `.pl`, `.pm` | `perl <file>` |
| **Zig** | `.zig` | `zig run <file>` |
| **Nim** | `.nim` | `nim c -r <file>` |
| **D** | `.d` | `rdmd <file>` |
| **Fortran** | `.f`, `.for`, `.f90`, `.f95`, `.f03`, `.f08` | `gfortran <file> -o <file>.exe` |
| **Pascal / Delphi** | `.pas`, `.pp`, `.dpr` | `fpc <file>` |
| **Haskell** | `.hs`, `.lhs` | `runghc <file>` |
| **Scala** | `.scala` | `scala-cli run <file>` |
| **Clojure** | `.clj`, `.cljs`, `.cljc` | `clojure -M <file>` |
| **Elixir** | `.ex`, `.exs` | `elixir <file>` |
| **Erlang** | `.erl` | `escript <file>` |
| **Racket / Scheme** | `.rkt`, `.scm`, `.ss` | `racket <file>` |
| **Common Lisp** | `.lisp`, `.lsp` | `sbcl --script <file>` |
| **Groovy** | `.groovy` | `groovy <file>` |
| **F#** | `.fs`, `.fsx` | `dotnet fsi <file>` |
| **AutoHotkey** | `.ahk` | `AutoHotkey.exe <file>` |
| **Nushell** | `.nu` | `nu <file>` |
| **LaTeX** | `.tex` | `pdflatex -interaction=nonstopmode <file>` |

### 🥉 Tier 3: Specialized & Workflow Handlings

- **HTML** (`.html`, `.htm`): Automatically launches the page in your default browser.
- **Markdown** (`.md`, `.markdown`): Opens the native VS Code Markdown preview side-by-side.
- **SQL** (`.sql`): Helpful prompt reminding to run queries through an active database connection.
- **Frontend Components** (`.jsx`, `.tsx`, `.vue`, `.svelte`, `.astro`): Guided alert suggesting to run project dev servers (`npm run dev`).
- **Dockerfile**: Executes `docker build -t local-image:latest .`.
- **CMake** (`CMakeLists.txt`, `.cmake`): Runs `cmake -B build` and `cmake --build build`.
- **CUDA** (`.cu`, `.cuh`): Compiles with `nvcc`.

---

## 📥 Installation

### Method 1: Install from VSIX (Local / GitHub Release)

1. Download the latest `.vsix` file from the [Releases](https://github.com/) page.
2. Open terminal and run:
   ```powershell
   code --install-extension "universal-run-button-0.1.0.vsix"
   ```
3. Or inside VS Code:
   - Go to the **Extensions** view (`Ctrl+Shift+X`).
   - Click the **···** (Views and More Actions) menu at the top-right.
   - Choose **Install from VSIX...** and select the `.vsix` package.

### Method 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/SambariJaiSurya/universal-run-button.git
cd universal-run-button

# Install development dependencies
npm install

# Compile the TypeScript extension
npm run compile

# Package into a .vsix file
npx @vscode/vsce package --no-git-tag-version

# Install into your VS Code
code --install-extension universal-run-button-0.1.0.vsix --force
```

---

## ⚙️ Configuration

You can override default binary names with absolute paths in your VS Code `settings.json`:

```json
{
  "universalRunner.toolPaths": {
    "python": "C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
    "gcc": "C:\\msys64\\ucrt64\\bin\\gcc.exe",
    "g++": "C:\\msys64\\ucrt64\\bin\\g++.exe",
    "javac": "C:\\Program Files\\Java\\jdk-21\\bin\\javac.exe",
    "rustc": "C:\\Users\\User\\.cargo\\bin\\rustc.exe"
  }
}
```

---

## 🚀 How to Use

1. Open any supported file (e.g. `main.cpp`, `Student.java`, `script.py`, or `index.html`).
2. Notice the **▶** (Run File) button on the top-right of your editor toolbar.
3. Click the button.
   - The file will be saved automatically.
   - The integrated terminal (`Universal Run`) will open.
   - Your code compiles (if compiled) and runs immediately.

---

## 🗑️ Uninstallation

```powershell
code --uninstall-extension local-developer.universal-run-button
```
Or find **Universal Run Button** in the Extensions sidebar and click **Uninstall**.

---

## 📄 License

This project is licensed under the MIT License.
