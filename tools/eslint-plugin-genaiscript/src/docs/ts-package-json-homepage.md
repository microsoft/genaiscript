# ts-package-json-homepage

Requires `homepage` in `package.json` to be set to the library's readme.

## Examples

### Good

```json
{
  "homepage": "https://github.com/Microsoft/genaiscript/packages/core/README.md"
}
```

### Bad

```json
{
  "homepage": "https://github.com/Microsoft/genaiscript/blob/dev/README.md"
}
```

```json
{
  "homepage": "https://github.com/Microsoft/genaiscript/blob/dev"
}
```

```json
{}
```

## When to turn off

Only if the rule breaks.

