# Python Library Reader Setup

The Python Reader detects external packages imported with `import <package>` or `from <package> import ...`.

It verifies package availability in the active Python environment and provides helpful installation guidance if missing.

## Adding a Registered Package
1. Copy `library-template.json` into `libraries/<name>.json`.
2. Add `<name>` to `registry.json`.

