
The `defFileMerge` function allows you to register a custom callback to override the default file merge behavior.
This can be useful for merging files in a different way than the default, for example, to merge files in a different format.

The function is called for all files; return the merged content or `undefined` to skip.

```js
defFileMerge((filename, label, before, generated) => {
    ...
})
```

You can define multiple file merge callbacks, they will be executed in order of registration.

## Example: content appender

The callback below appends the content in generated `.txt` files.

```js
// append generated content
defFileMerge((filename, label, before, generated) => {
    // only merge .txt files
    if (!/\.txt$/i.test(filename)) return undefined
    // if content already existing, append generated content
    if (before) return `${before}\n${generated}`
    // otherwise return generated content
    else return generated
})
```
