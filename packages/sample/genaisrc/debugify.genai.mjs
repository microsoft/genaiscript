script({
    accept: ".ts",
    system: ["system.assistant", "system.typescript", "system.files"],
    systemSafety: false,
})

const file = def("FILE", env.files, { prediction: true })
$`Your task is to instrument the TypeScript code in file ${file} with debug logging. Be concise, no explanations.

## Setup the logger
- You are using the 'debug' npm package for logging (https://www.npmjs.com/package/debug).
- You should instantiate a logger for each file named 'dbg'. The logger name is the file name without the extension.
Reuse the logger if it already exists.

\`\`\`ts
import debug from "debug"
const dbg = debug("config")
\`\`\`

## Add debug logs
- Add debug log statement at each significant point in the code.

\`\`\`ts
dbg('message')
\`\`\`

### Good logs
- Before doing any kind of file operation, log the file path.
- In a catch handler, log the error.
- Before returning a value, log the value.
- Only add log statement, DO NOT REMOVE OR CHANGE ANY EXISTING CODE.
`

defFileOutput("*.ts", "The TypeScript file with debug logs")
