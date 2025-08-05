# Workspace File Security Configuration

The GenAIScript workspace file system now includes enhanced security features to prevent writing files outside the workspace and provides configurable file access policies.

## Security Features

### 1. Workspace Boundary Protection

All file write operations are now restricted to the current workspace (project folder). The system prevents:
- Writing to absolute paths outside the workspace (e.g., `/etc/passwd`)
- Path traversal attacks (e.g., `../../../etc/passwd`)
- Access to parent directories beyond the workspace root

### 2. Environment File Protection

Writing to `.env` files is blocked by default to prevent accidental exposure of secrets:
- Direct `.env` files in any directory
- Files matching the `.env` pattern (`.env.*`, `.env.local`, etc.)

### 3. Configurable File Policies

You can configure allowed and disallowed file patterns using glob patterns:

```typescript
import { createWorkspaceFileSystem } from "@genaiscript/core";

// Example: Only allow writing to documentation and source files
const fs = createWorkspaceFileSystem({
  allowedFiles: ["docs/**/*.md", "src/**/*.{js,ts}", "*.txt"],
  disallowedFiles: ["config/**/*", "*.exe", "*.bat"]
});
```

## Usage Examples

### Safe File Writing with fs_write_file Tool

The new `fs_write_file` system tool provides LLMs with controlled file writing capabilities:

```genai
script({
  title: "Safe file operations",
  system: ["fs_write_file"]
})

$`Create a README.md file with project documentation.`
// The LLM can now use fs_write_file to create files safely within the workspace
```

### Workspace API Usage

```typescript
// Write a file (within workspace only)
await workspace.writeText("output/results.json", JSON.stringify(data));

// Append to a log file
await workspace.appendText("logs/activity.log", "New entry\n");

// These will be blocked:
// await workspace.writeText("/etc/passwd", "malicious"); // Outside workspace
// await workspace.writeText(".env", "SECRET=value");     // Environment file
```

## Error Messages

When file operations are blocked, you'll see descriptive error messages:

- `writing outside workspace not allowed: /path/to/file`
- `writing .env not allowed`
- `writing to disallowed file: config/secret.txt`
- `writing to file not in allowed list: script.exe`

## Configuration Priority

When both `allowedFiles` and `disallowedFiles` are specified:
1. `disallowedFiles` patterns are checked first and take precedence
2. `allowedFiles` patterns are checked second
3. If neither match, the operation proceeds (unless other security rules apply)

This layered approach ensures maximum security while maintaining flexibility for legitimate use cases.