# ts-package-json-repo

Requires `repository` in `package.json` to be set to `"github:Microsoft/genaiscript"`.

This rule is fixable using the `--fix` option.

## Examples

### Good

```json
{
  "repository": "github:Microsoft/genaiscript"
}
```

### Bad

```json
{
  "repository": "github:Microsoft/TypeScript"
}
```

```json
{}
```

## When to turn off

Only if the rule breaks.

## [Source](https://azure.github.io/azure-sdk/typescript_implementation.html#ts-package-json-repo)
