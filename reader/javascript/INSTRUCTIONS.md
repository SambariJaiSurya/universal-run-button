# JavaScript & Node.js External Library Instructions

This guide explains how to configure and register external npm packages for the Universal Run Button.

---

## 1. Where to Add Configurations

1. Configuration file:
   `reader/javascript/libraries/<package-name>.json`
2. Registry file:
   `reader/javascript/registry.json`

---

## 2. Configuration Fields Reference

Template:
```json
{
  "name": "express",
  "importNames": [
    "express"
  ],
  "npmPackage": "express"
}
```

---

## 3. How to Write Names and Paths Correctly

### 1. `"name"`
- **How to write**: Lowercase identifier matching the file name without `.json` (e.g. `"express"`, `"three"`, `"axios"`).

### 2. `"importNames"`
- **How to write**: The string passed to `import ... from "..."` or `require("...")`.
- **Examples**:
  - `const express = require('express')` -> `"importNames": ["express"]`
  - `import * as THREE from 'three'` -> `"importNames": ["three"]`
  - Scoped npm packages: `import { Client } from '@anthropic-ai/sdk'` -> `"importNames": ["@anthropic-ai/sdk"]`

### 3. `"npmPackage"`
- **How to write**: The exact package name used with `npm install <package>`.

---

## 4. How to Register in `registry.json`

Open `reader/javascript/registry.json`:
```json
{
  "libraries": [
    "express",
    "three"
  ]
}
```

Local files (`./utils.js`) and built-in Node.js modules (`fs`, `path`, `http`) are automatically recognized and will never trigger external package warnings.

