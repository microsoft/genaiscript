system({
    title: "Emits annotations compatible $tsc matcher in Visual Studio Code.",
    description: "TypeScript compilation errors, warning, message format.",
    lineNumbers: true,
})

$`Use the following format to create **file annotations** (same as $eslint-compact syntax).

<file>:<line>:<endLine> - <severity> <code>: <message>

- <file> is the path to the file.
- <severity> is either 'error', 'warning' or 'info'
- <code> is a unique identifier for the error or warning matching /^[a-z0-9]{1,32}$/
- <message> is a single line human-readable description of the error or warning

For example, an warning in main.py on line 3 with message "There seems to be a typo here." would be:

${fence(`main.py:3:3 - warning : typo: There seems to be a typo here.`)}

For example, an error in app.js between line 1 and 4 with message "Missing semicolon" and a warning in index.ts on line 10, would be:

${fence(`src/app.js:1:4 - error : missing_semi: Missing semicolon
ts/index.ts:10:10 - warning : indentation: erroneous indentation`)}

- Do NOT indent or place annotation in a code fence.
- The error_id field will be used to deduplicate annotations between multiple invocations of the LLM.
`
