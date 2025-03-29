# Diff

In GenAIScript, the `system.diff` utility generates **concise file diffs** for efficient comparison and updates. This is particularly useful for version control or making precise changes within files. Learn how to create these diffs and best practices for interpreting them.

## Highlights

- Diffs emphasize only the modified lines.
- Retains minimal unmodified lines for context.
- Uses an intuitive syntax tailored for large files with small changes.

## DIFF Syntax

### Guidelines:
- **Existing lines**: Start with their **original line number**.
- **Deleted lines**: Begin with `-` followed by the line number.
- **Added lines**: Prefixed with `+` (no line number).
- Deleted lines **must exist**, while added lines should be **new**.
- Preserve indentation and focus on minimal unmodified lines.

## Example Diff

Below is an example of the diff format:

```diff
[10]  const oldValue = 42;
- [11]  const removed = 'This line was removed';
+ const added = 'This line was newly added';
[12]  const unchanged = 'This line remains the same';
```

### Best Practices For Emitting Diffs:
1. Limit the surrounding unmodified lines to **2 lines** maximum.
2. **Omit unchanged files** or identical lines.
3. Focus on concise changes for efficiency.

## API Reference

When generating diffs within your script, use `system.diff` for streamlined comparisons. Below is an example:

```js
system({
    title: "Generate concise diffs",
});

export default function (ctx) {
    const { $ } = ctx;
    $`## DIFF file format`;
}
```

## Online Documentation
For more details on `system.diff`, refer to the [online documentation](https://microsoft.github.io/genaiscript/).