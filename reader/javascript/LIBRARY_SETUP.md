# JavaScript Library Reader Setup

The JavaScript Reader detects external npm packages imported via:
- `import express from "express";`
- `const express = require("express");`

It excludes Node.js built-ins (`fs`, `path`, `http`, etc.) and relative local files (`./utils`).

