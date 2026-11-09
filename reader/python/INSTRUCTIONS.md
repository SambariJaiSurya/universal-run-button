# Python External Library Instructions

This guide explains how to configure and register external Python packages for the Universal Run Button.

---

## 1. Where to Add Configurations

1. Configuration file:
   `reader/python/libraries/<package-name>.json`
2. Registry file:
   `reader/python/registry.json`

---

## 2. Configuration Fields Reference

Template:
```json
{
  "name": "pygame",
  "importNames": [
    "pygame"
  ],
  "pipName": "pygame",
  "minPythonVersion": "3.8"
}
```

---

## 3. How to Write Names and Paths Correctly

### 1. `"name"`
- **How to write**: Lowercase identifier matching the file name without `.json` (e.g. `"pygame"`, `"numpy"`, `"flask"`).

### 2. `"importNames"`
- **How to write**: The module name(s) used in your Python code after `import` or `from`.
- **Examples**:
  - `import pygame` -> `"importNames": ["pygame"]`
  - `from PIL import Image` -> `"importNames": ["PIL"]`
  - `import cv2` -> `"importNames": ["cv2"]`
  - Multiple imports for one package:
    `"importNames": ["yaml", "ruamel.yaml"]`

### 3. `"pipName"`
- **How to write**: The exact package name used with `pip install`.
- **Examples**:
  - For OpenCV (`import cv2`): `"pipName": "opencv-python"`
  - For Pillow (`from PIL import Image`): `"pipName": "Pillow"`
  - For Pygame (`import pygame`): `"pipName": "pygame"`

---

## 4. How to Register in `registry.json`

Open `reader/python/registry.json`:
```json
{
  "libraries": [
    "pygame",
    "numpy"
  ]
}
```

When you write `import pygame` in your `.py` file, the extension recognizes it as an external package and ensures your Python environment runs it with real-time output.

