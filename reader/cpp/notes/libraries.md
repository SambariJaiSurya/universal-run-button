# C/C++ Registered Libraries Reference

> **Notice:** This document is human-readable documentation and reference only. The extension does NOT parse this markdown file to generate build commands; it reads the authoritative JSON configurations in `reader/cpp/libraries/`.

## Active Libraries

### 1. Raylib
- **Identifier**: `raylib`
- **Config**: [`libraries/raylib.json`](libraries/raylib.json)
- **Primary Headers**: `raylib.h`, `raymath.h`, `rlgl.h`
- **Linker Dependencies**: `-lopengl32`, `-lgdi32`, `-lwinmm`
- **Description**: A simple and easy-to-use library to enjoy videogames programming.

