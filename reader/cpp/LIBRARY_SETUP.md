# C/C++ External Library Setup Guide

Welcome to the **Universal Run Button** Reader System for C and C++.

This system lets you write C or C++ programs using external libraries without manually typing complex compiler flags or include paths every time.

---

## 1. How Automatic Library Detection Works

1. You write your code (e.g., `#include "raylib.h"` or `#include <GLFW/glfw3.h>`).
2. You click the ▶ **Run** button.
3. The **Reader System**:
   - Inspects your source file for include directives.
   - Filters out standard C/C++ headers (`<iostream>`, `<vector>`, `<stdio.h>`, etc.) and project-local headers.
   - Searches `reader/cpp/registry.json` for registered libraries matching the detected header.
   - Loads the corresponding JSON configuration from `reader/cpp/libraries/<library-name>.json`.
   - Recursively resolves any dependencies listed in the configuration.
   - Validates that required compilers, include directories, and library files exist on your computer.
   - Constructs compiler and linker arguments with safe paths and linker flag ordering.
4. The extension builds your program into `build/<program>.exe` and automatically launches it in the integrated terminal.

> [!IMPORTANT]
> **Adding a new library never requires modifying TypeScript code.**  
> You only need to create a `.json` configuration file and register its name in `registry.json`.

---

## 2. Directory Layout Concept

A typical external library structure looks like this:

```text
E:/Libraries/raylib/
│
├── include/           <-- Header files (*.h, *.hpp)
│   ├── raylib.h
│   ├── raymath.h
│   └── rlgl.h
├── lib/               <-- Static libraries (*.a, *.lib)
│   └── libraylib.a
└── bin/               <-- Dynamic runtime files (*.dll) [if applicable]
    └── raylib.dll
```

### Key Concepts Explained:
- **`includePaths`**: Directories passed to the compiler with `-I` so it can find `#include "..."` or `#include <...>`.
- **`libraryPaths`**: Directories passed to the linker with `-L` where static/import libraries are located.
- **`libraryFiles`**: Full path or name of the library file itself (e.g. `libraylib.a`).
- **`runtimePaths`**: Folders added to PATH or where runtime `.dll` files reside.
- **`compilerFlags`**: Flags given during compilation (e.g. `-O2`, `-Wall`).
- **`linkerFlags`**: Flags given during linking (e.g. `-lopengl32`, `-lgdi32`, `-lwinmm`).
- **`dependencies`**: Other registered libraries that this library requires (e.g. `["glfw"]`).

---

## 3. Real Example: Raylib Setup

Here is the exact configuration currently running for Raylib:

File: `reader/cpp/libraries/raylib.json`
```json
{
  "name": "raylib",
  "headers": [
    "raylib.h",
    "raymath.h",
    "rlgl.h"
  ],
  "includePaths": [
    "E:/raylib/raylib/src"
  ],
  "libraryPaths": [
    "E:/raylib/raylib/src"
  ],
  "libraryFiles": [
    "E:/raylib/raylib/src/libraylib.a"
  ],
  "runtimePaths": [],
  "runtimeFiles": [],
  "compilerFlags": [],
  "linkerFlags": [
    "-lopengl32",
    "-lgdi32",
    "-lwinmm"
  ],
  "dependencies": [],
  "compiler": "g++",
  "standard": "c++17"
}
```

### Why these linker flags?
- `-lopengl32`: Windows OpenGL 32-bit/64-bit graphics library.
- `-lgdi32`: Windows Graphics Device Interface (windowing and rendering context).
- `-lwinmm`: Windows Multimedia API (audio device and high-resolution timer).

---

## 4. How to Add a New Library (Step-by-Step)

1. Open `reader/cpp/library-template.json`.
2. Copy it to `reader/cpp/libraries/<your-library-name>.json` (e.g. `glfw.json`).
3. Fill in:
   - `name`: Identical to the filename without `.json`.
   - `headers`: List of headers that identify this library (e.g. `["GLFW/glfw3.h"]`).
   - `includePaths`: Paths to the folder containing the headers.
   - `libraryFiles`: Full path to `.a` or `.lib` file.
   - `linkerFlags`: Any system libraries required.
4. Open `reader/cpp/registry.json` and add your library name:
   ```json
   {
     "libraries": [
       "raylib",
       "glfw"
     ]
   }
   ```
5. Save the file. Your new library is now active immediately!

---

## 5. Troubleshooting Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **"Header not detected"** | Header name in code doesn't match `headers` array in JSON | Check spelling and case in `headers` in the library JSON. |
| **"Library file could not be found"** | Path in `libraryFiles` does not exist | Verify the exact path on disk. |
| **"Undefined reference to ..."** | Missing linker flag or library file | Ensure required dependencies (like OpenGL, WinMM) are in `linkerFlags`. |
| **"32-bit vs 64-bit mismatch"** | MinGW is 64-bit (UCRT64) but the library was built for 32-bit | Recompile or download the 64-bit version of the library. |
| **"Invalid JSON"** | Trailing comma or syntax error in JSON | Validate JSON syntax in VS Code. |

