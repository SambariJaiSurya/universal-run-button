# Java External Library (JAR) Instructions

This guide explains how to configure and register external Java `.jar` libraries for the Universal Run Button.

---

## 1. Where to Add Configurations

1. Configuration file:
   `reader/java/libraries/<library-name>.json`
2. Registry file:
   `reader/java/registry.json`

---

## 2. Configuration Fields Reference

Template:
```json
{
  "name": "gson",
  "packages": [
    "com.google.gson"
  ],
  "jarFiles": [
    "E:/Libraries/java/gson-2.10.1.jar"
  ]
}
```

---

## 3. How to Write Names and Paths Correctly

### 1. `"name"`
- **How to write**: Lowercase library name without `.json` (e.g. `"gson"`, `"mysql-connector"`, `"javafx"`).

### 2. `"packages"`
- **How to write**: The package prefix from your `import` statements in Java.
- **Examples**:
  - If your Java file has `import com.google.gson.Gson;`:
    `"packages": ["com.google.gson"]`
  - If your code uses Apache Commons: `import org.apache.commons.io.FileUtils;`:
    `"packages": ["org.apache.commons.io"]`
  - If your code uses MySQL JDBC: `import java.sql.*` or driver:
    `"packages": ["com.mysql.cj.jdbc"]`

### 3. `"jarFiles"` (Path to JAR archive)
- **How to write**: Full absolute path to the `.jar` archive file. Use forward slashes (`/`).
- **Examples**:
  - `"jarFiles": ["E:/Libraries/java/gson-2.10.1.jar"]`
  - Multiple JARs:
    ```json
    "jarFiles": [
      "C:/JavaLibs/javafx/javafx.base.jar",
      "C:/JavaLibs/javafx/javafx.controls.jar"
    ]
    ```

---

## 4. How to Register in `registry.json`

Open `reader/java/registry.json`:
```json
{
  "libraries": [
    "gson"
  ]
}
```

When you write `import com.google.gson.Gson;` in your Java file, the classpath (`-cp`) automatically includes the configured JAR files during compilation and execution!

