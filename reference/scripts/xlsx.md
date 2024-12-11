
Parsing and stringifying of Excel spreadsheet files, xlsx.

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provide a versatile parser for XLSX. It returns an array of sheets (`name`, `rows`)
where each row is an array of objects.

```js
const sheets = await parsers.XLSX(env.files[0])
```
