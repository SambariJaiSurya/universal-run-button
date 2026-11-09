# C and C++ External Library Instructions

This guide explains **how to write library names, headers, and file paths** when configuring any C or C++ external library in the Universal Run Button.

---

## 1. Where to Add Configurations

Every library needs two things:
1. A JSON configuration file placed inside:
   `reader/cpp/libraries/<library-name>.json`
2. Its name added into the registry list in:
   `reader/cpp/registry.json`

---

## 2. Configuration Fields Reference

Here is the exact template with explanations:

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

---

## 3. How to Write Names and Paths Correctly

### 1. `"name"`
- **How to write**: Lowercase identifier, no spaces (e.g. `"raylib"`, `"glfw"`, `"sdl2"`, `"curl"`).
- **Rule**: Must match the JSON filename without `.json` (`raylib.json` -> `"raylib"`).

### 2. `"headers"`
- **How to write**: The exact text that appears between `#include "..."` or `#include <...>`.
- **Examples**:
  - If your code uses `#include "raylib.h"`:
    `"headers": ["raylib.h"]`
  - If your code uses `#include <GLFW/glfw3.h>`:
    `"headers": ["GLFW/glfw3.h"]`
  - If a library has multiple headers:
    `"headers": ["SDL.h", "SDL_image.h", "SDL_ttf.h"]`

### 3. `"includePaths"` (Where header files `.h` live)
- **How to write**: The folder that contains the header files. Use forward slashes (`/`).
- **Examples**:
  - If `raylib.h` is located at `E:\raylib\raylib\src\raylib.h`:
    `"includePaths": ["E:/raylib/raylib/src"]`
  - If `glfw3.h` is located at `C:\Libraries\glfw\include\GLFW\glfw3.h`:
    `"includePaths": ["C:/Libraries/glfw/include"]` (Notice you point to `include`, not `include/GLFW`, because code includes `<GLFW/glfw3.h>`).

### 4. `"libraryPaths"` (Where `.a` or `.lib` folders live)
- **How to write**: Folder containing compiled library binaries (used for `-L` flag).
- **Example**:
  `"libraryPaths": ["E:/raylib/raylib/src"]` or `["C:/Libraries/glfw/lib-mingw-w64"]`

### 5. `"libraryFiles"` (The exact library archive)
- **How to write**: Full absolute path to the `.a` (MinGW / GCC) or `.lib` (MSVC) file.
- **Examples**:
  - `"libraryFiles": ["E:/raylib/raylib/src/libraylib.a"]`
  - `"libraryFiles": ["C:/Libraries/glfw/lib/libglfw3.a"]`

### 6. `"linkerFlags"` (System and secondary libraries)
- **How to write**: Flags starting with `-l` that the operating system requires.
- **Common Windows linker flags**:
  - OpenGL graphics: `"-lopengl32"`
  - Windows GUI / GDI: `"-lgdi32"`
  - Windows Multimedia: `"-lwinmm"`
  - Windows Sockets: `"-lws2_32"`

### 7. `"dependencies"`
- **How to write**: List of other registered library names that must be linked automatically.
- **Example**: If `myengine` requires `raylib`:
  `"dependencies": ["raylib"]`

---

## 4. How to Register in `registry.json`

Open `reader/cpp/registry.json`:
```json
{
  "libraries": [
    "raylib"
  ]
}
```
Just add your library's name to the list:
```json
{
  "libraries": [
    "raylib",
    "glfw"
  ]
}
```

Now any `.c` or `.cpp` file with `#include "raylib.h"` or `#include <GLFW/glfw3.h>` will automatically detect, link, and run without manual commands!

