# ts-versioning-semver

Requires `version` in `package.json` to be in [SemVer](https://semver.org/).

Additionally, the following rules are checked:

- Major versions of `0` are not permitted,
- Alpha versions must be in the format `<version>-alpha.<date>.<alpha-version>` where `date` is an integer representing a particular day (e.g. 20200728 is July 28th, 2020), and `alpha-version` is an integer.
- Beta versions must be in the format `<version>-beta.<beta-version>`, where `beta-version` is an integer.
- Preview versions must be in the format `<version>-preview.<preview-version>`, where `preview-version` is an integer.
- Development versions must be in the format `<version>-dev.<date>.<dev-version>` where `date` is an integer representing a particular day (e.g. 20200728 is July 28th, 2020), and `dev-version` is an integer.

## Examples

### Good

```json
{
  "version": "1.0.0"
}
```

```json
{
  "version": "1.0.0-alpha.20200728.1"
}
```

```json
{
  "version": "1.0.0-beta.1"
}
```

### Bad

```json
{
  "version": "1.0.01"
}
```

```json
{
  "version": "1.0"
}
```

```json
{
  "version": "1"
}
```

```json
{
  "version": "0.0.1"
}
```

```json
{
  "version": "1.0.0.0"
}
```

```json
{
  "version": "1.0.0-preview.1"
}
```

```json
{
  "version": "1.0.0-dev.20200728.1"
}
```

```json
{}
```

## When to turn off

Only if the rule breaks.

