GenAIScript provides access to the file system of workspace and to the selected files in the user interface.

The file paths are rooted in the project workspace folder. In Visual Studio Code, this is the root folder opened (multi-root workspaces are not yet supported). Using the command line, the workspace root is the current working directory when launching the CLI.

## `env.files`

The variable `env.files` contains an array of files that have been
selected by the user through the user interface or the command line.

You can pass `env.files` directly in the [def](/genaiscript/reference/scripts/context)
function and add additional filters to the files.

```js
def("PDFS", env.files, { endsWith: ".pdf" })
```

## `.gitignore` and `.gitignore.genai`

By default, the `.gitignore` (workspace level) and `.gitignore.genai` (project level) files are respected when selecting files.

Turn off this mode by setting the `ignoreGitIgnore` option to `true`:

```js
script({
    // don't filter env.files
    ignoreGitIgnore: true,
})
```

or on the `cli run` command:

```sh
genaiscript run --ignore-git-ignore
```

`.gitignore.genai` is an extra file that is used to filter files in the project. It is useful when you want to exclude files from the project that are not relevant for the script beyond the `.gitignore` file.

## file output

Use [defFileOutput](/genaiscript/reference/scripts/file-output) to specify allowed file output paths and the description
of the purpose of those files.

```js
defFileOutput("src/*.md", "Product documentation in markdown format")
```

## `workspace`

The `workspace` object provides access to the file system of the workspace.

### `findFiles`

Performs a search for files under the workspace. Glob patterns are supported.

```ts
const mds = await workspace.findFiles("**/*.md")
def("DOCS", mds)
```

The `.gitignore` are respected by default. You can disable this behavior by setting the `ignoreGitIgnore` option to `true`.

### `grep`

Performs a regex 'grep' search for files under the workspace using [ripgrep](https://github.com/BurntSushi/ripgrep). The pattern can be a string or a regular expression.

```ts
const { files } = await workspace.grep("monkey", "**/*.md")
def("FILE", files)
```

The pattern can also be a regex, in which case sensitivity follows the regex option.

```ts
const { files } = await workspace.grep(/[a-z]+\d/i, "**/*.md")
def("FILE", files)
```

The `.gitignore` are respected by default. You can disable this behavior by setting the `ignoreGitIgnore` option to `true`.

### `readText`

Reads the content of a file as text, relative to the workspace root.

```ts
const file = await workspace.readText("README.md")
const content = file.content
```

It will automatically convert PDFs and DOCX files to text.

### `readJSON`

Reads the content of a file as JSON (using a [JSON5](https://json5.org/) parser).

```ts
const data = await workspace.readJSON("data.json")
```

### `readXML`

Reads the content of a file as XML format.

```ts
const data = await workspace.readXML("data.xml")
```

### `readCSV`

Reads the content of a file as CSV format.

```ts
const data = await workspace.readCSV("data.csv")
```

In Typescript, you can type the output.

```ts '<{ name: string; value: number }>'
const data = await workspace.readCSV<{ name: string; value: number }>(
    "data.csv"
)
```

### `readData`

This helper API tries to infer the data type automatically and parse it out. It supports JSON, JSON5, YAML, XML, INI, TOML, CSV, XLSX.

```js
const data = await workspace.readData("filename.csv")
```

### Schema validation

You can provide a [JSON schema](/genaiscript/reference/scripts/schemas) to validate the parsed data.
By default, invalid data is silently ignored and the return value is `undefined` but you can force
the API to throw using `throwOnValidationError`.

```ts
const data = await workspace.readJSON("data.json", {
    schema: { type: "object", properties: { ... }, },
    throwOnValidationError: true
})
```

### `writeText`

Writes text to a file, relative to the workspace root.

```ts
await workspace.writeText("output.txt", "Hello, world!")
```

### `appendText`

Appends text to a file, relative to the workspace root.

```ts
await workspace.appendText("output.txt", "Hello, world!")
```

## Workspace Security

The GenAIScript workspace file system includes enhanced security features to prevent writing files outside the workspace and provides configurable file access policies.

### Workspace Boundary Protection

All file write operations are restricted to the current workspace (project folder). The system prevents:
- Writing to absolute paths outside the workspace (e.g., `/etc/passwd`)
- Path traversal attacks (e.g., `../../../etc/passwd`)
- Access to parent directories beyond the workspace root

```ts
// ✅ Safe - within workspace
await workspace.writeText("output/results.json", JSON.stringify(data));

// ❌ Blocked - outside workspace
await workspace.writeText("/etc/passwd", "malicious content");

// ❌ Blocked - path traversal
await workspace.writeText("../../../etc/passwd", "malicious content");
```

### Environment File Protection

Writing to `.env` files is blocked by default to prevent accidental exposure of secrets:
- Direct `.env` files in any directory
- Files matching the `.env` pattern (`.env.*`, `.env.local`, etc.)

```ts
// ❌ Blocked - environment file
await workspace.writeText(".env", "SECRET=value");
```

### fs_write_file System Tool

The `fs_write_file` system tool provides LLMs with controlled file writing capabilities:

```js
script({
  title: "Safe file operations",
  system: ["fs_write_file"]
})

$`Create a README.md file with project documentation.`
// The LLM can now use fs_write_file to create files safely within the workspace
```

### Security Error Messages

When file operations are blocked, you'll see descriptive error messages:

- `writing outside workspace not allowed: /path/to/file`
- `writing .env not allowed`
- `writing to disallowed file: config/secret.txt`
- `writing to file not in allowed list: script.exe`

### Bypassing Workspace Security (Advanced)

For scripts that require unrestricted file system access outside the workspace boundaries, you can use Node.js file system APIs directly. **Use this approach with extreme caution** as it bypasses all workspace security protections:

```typescript
// Import Node.js file system modules for unchecked operations
const fs = await import('fs')
const path = await import('path')

// ⚠️ WARNING: This bypasses workspace security!
// Write to any location on the file system
const absolutePath = path.join('/tmp', 'unrestricted-file.txt')
fs.writeFileSync(absolutePath, 'This file is written outside workspace boundaries')

// Read from any location
const systemFile = fs.readFileSync('/etc/hosts', 'utf8')
```

**Important considerations when using direct Node.js file system APIs:**

- **Security Risk**: No path validation or boundary checking
- **Portability**: Absolute paths may not work across different operating systems
- **Permissions**: Operations may fail due to file system permissions
- **Responsibility**: You are responsible for validating paths and ensuring safe operations

**When to use direct Node.js APIs:**
- System administration scripts that need access to system files
- Build tools that operate on files outside the project
- Migration scripts that access multiple project directories
- Advanced automation that requires unrestricted file access

**Best practices:**
- Always validate and sanitize file paths when using user input
- Use `path.resolve()` and `path.normalize()` to handle paths safely
- Check file permissions before attempting operations
- Consider using the workspace APIs first and only escalate to direct Node.js APIs when necessary

## paths

The `paths` object contains helper methods to manipulate file names.

### Current path vs workspace path

By default, files are resolved relative to the workspace root. You can use the `path` object to resolve paths relative to the current specification, `env.spec`.

```ts
const cur = path.dirname(env.spec.filename)
const fs = path.join(cur, "myfile.md")
```

### globs

File path "globs" are patterns used to match file and directory names. They are commonly used in Unix-like operating systems and programming languages to specify sets of filenames with wildcard characters. This section covers the basics of using globs in file paths with workspace.findFiles.

Glob patterns can have the following syntax:

- `*` to match zero or more characters in a path segment
- `?` to match on one character in a path segment
- `**` to match any number of path segments, including none
- `{}` to group conditions (e.g. `**/*.{ts,js}` matches all TypeScript and JavaScript files)
- `[]` to declare a range of characters to match in a path segment (e.g., `example.[0-9]` to match on example.0, example.1, …)
- `[!...]` to negate a range of characters to match in a path segment (e.g., `example.[!0-9]` to match on example.a, example.b, but not example.0)

Note: a backslash (`\`\``) is not valid within a glob pattern. If you have an existing file path to match against, consider to use the relative pattern support that takes care of converting any backslash into slash. Otherwise, make sure to convert any backslash to slash when creating the glob pattern.