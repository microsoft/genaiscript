# System Scripts and Microformats

Teach the LLM how to format response for files, special formats, register tools ...

<v-click>

- `system.files.genai.js`
```js
system({ title: "File generation" })
$`When generating or updating files you will use the following syntax:`
...
```

</v-click>

<v-click>

- `system.diff.genai.js`
```js
system({ title: "Diff generation", lineNumbers: true,})
$`The DIFF format should be used to generate diff changes on files: 
- added lines MUST start with +
- deleted lines MUST start with -
- deleted lines MUST exist in the original file (do not invent deleted lines)
- added lines MUST not exist in the original file
...
```

</v-click>