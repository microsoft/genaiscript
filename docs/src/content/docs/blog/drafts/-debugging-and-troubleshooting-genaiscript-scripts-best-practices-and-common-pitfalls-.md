---
title: '"Debugging and Troubleshooting GenAIScript Scripts: Best Practices and
  Common Pitfalls"'
date: 2025-06-19
authors: genaiscript
draft: true
tags:
  - debugging
  - troubleshooting
  - best-practices
  - genaiscript
  - scripting

---

## "Debugging and Troubleshooting GenAIScript Scripts: Best Practices and Common Pitfalls"

Debugging GenAIScript scripts is vital for building robust automations and prompts! This post walks through a real-world debugging and troubleshooting demo script—explaining each step, sharing essential best practices, and highlighting common mistakes you can avoid.

Let’s break down the demo script, line by line, and learn how to make your GenAIScript development experience smoother, more predictable, and less error-prone. 🚦

---

### 1. Script Metadata and Initialization

```js
script({
    name: "debug-troubleshoot-demo",
    description: "Demonstrates debugging, logging, and common pitfalls in GenAIScript scripts.",
    files: "*.md"
})
```

**What it does:**  
The `script` function defines key metadata for your GenAIScript script, including a unique name, a clear description, and a file pattern to operate on.  
- `name` helps identify your script in outputs.
- `description` says what the script does.
- `files` specifies a glob pattern — here, all Markdown (`.md`) files.

[See script() in the docs.](https://microsoft.github.io/genaiscript/reference/script/)

---

### 2. Logging for Troubleshooting

```js
log("Script started. Beginning troubleshooting demo.")
```

**What it does:**  
The `log()` function sends output to the console or GenAIScript logs. Logging early lets you know the script has started and is especially useful when diagnosing at which step things may be failing.

[See log() in the docs.](https://microsoft.github.io/genaiscript/reference/log/)

---

### 3. Catching a Common Pitfall: Wrong File Patterns

```js
try {
    let files = files({ endsWith: ".notarealextension" })
    if (!files.length) {
        log("No files found with .notarealextension. This is a common pitfall: incorrect file pattern.")
    }
} catch (err) {
    log("Error while fetching files (pitfall: invalid pattern): " + err.message)
}
```

**What it does:**  
- **Tries** to find files with a made-up extension (`.notarealextension`).  
- If none found, logs an explanation about incorrect file patterns—a very common rookie mistake.
- If the files API throws, we catch the error and log it.

**Pro tip:** Always double-check your file patterns!

[Learn about the files() API.](https://microsoft.github.io/genaiscript/reference/files/)

---

### 4. Debugging with Breakpoints (VSCode)

```js
let testVar = 42
log("Debugging tip: Set a breakpoint here to inspect testVar = " + testVar)
```

**What it does:**  
Creates a test variable to illustrate where to set a **breakpoint** in VSCode. You can pause here and inspect script state during execution—a classic and powerful debugging technique.

---

### 5. Error Handling Example

```js
try {
    let content = readFile("nonexistent-file.md")
    log("Should not see this: " + content)
} catch (err) {
    log("Caught expected error reading nonexistent file: " + err.message)
}
```

**What it does:**  
Simulates reading a file that doesn't exist.  
- If it exists (unexpectedly), logs its content.
- But normally, it throws—so we catch and log the friendly error message.

**Best practice:** Anticipate and handle possible errors!

[Check out readFile() in the docs.](https://microsoft.github.io/genaiscript/reference/readFile/)

---

### 6. Parameterize Input (Best Practice)

```js
param("filePattern", { type: "string", default: "*.md", description: "Glob pattern for files." })
let userFiles = files({ glob: filePattern })
log("Found files: " + userFiles.join(", "))
```

**What it does:**  
- Uses `param()` to allow users to supply a file pattern as an input—a handy way to make your scripts reusable and configurable.
- Fetches files matching that pattern.

**Why?**  
Hardcoding values is brittle; allowing parameters makes scripts flexible.

[More on param().](https://microsoft.github.io/genaiscript/reference/param/)

---

### 7. Keeping Scripts Focused (Best Practice)

```js
$`Summarize the content of the following file(s): ${userFiles.join(", ")}`
```

**What it does:**  
This is a template string passed directly to the AI—clearly asking for a summary of the found files.  
**Best practice:** Focus each script on a single, clear task to ensure reliability and readability.

---

### 8. Checking for Empty Results (Common Pitfall)

```js
if (!userFiles.length) {
    log("Warning: No files found. Check your filePattern parameter.")
}
```

**What it does:**  
Before acting on the file list, always *check if it’s empty* and let the user know. Accidentally processing no input is a classic script bug.

---

### 9. Script Completion Log

```js
log("Script finished.")
```

**What it does:**  
Marks the successful end of your script. This indicates everything ran as expected.

---

## Summary 🎉

- Use `log()` generously to illuminate your script’s behavior.
- Validate input parameters and check for empty results to avoid no-op bugs.
- Wrap riskier API calls (like `readFile`) in `try/catch` for graceful error handling.
- Parameterize script input to make scripts reusable.
- For debugging: set VSCode breakpoints and use in-script variable logs.
- Keep scripts focused and simple.
- Explicitly alert the user to the most common pitfalls, like file pattern mismatches.

By following these best practices, you’ll reduce frustration and enjoy a smooth, bug-resistant GenAIScript workflow. Happy scripting! 🚀

---

**Explore more with the [GenAIScript Docs](https://microsoft.github.io/genaiscript/).**