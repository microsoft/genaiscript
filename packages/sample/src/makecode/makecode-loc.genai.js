script({
    title: "MakeCode Blocks Localization",
    description: "Translation block strings for MakeCode",
})

/**
 * The makecode localization files for block in packages is a JSON file that looks like this: key -> localized value
 * 
```json
  "modules.ServoClient.setEnabled|block": "set %servo %value=toggleOnOff",
  "modules.ServoClient.stop|block": "servo continuous %servo stop",
  "modules.servo1|block": "servo1",
  "modules.servo2|block": "servo2",
  "modules.servo3|block": "servo3",
  "modules.servo4|block": "servo4",
  "modules|block": "modules",
  "{id:category}Jacdac": "Jacdac",
  "{id:category}Modules": "Modules",
```
 */

// language parameterization
const langCode = env.vars.lang || "fr"
// given a language code, refer to the full name to help the LLM
const langName = {
    fr: "French",
    "es-ES": "Spanish",
    de: "German",
    sr: "Serbian",
    vi: "Vietnamese",
    it: "Italian",
}[langCode]
if (!langName) cancel("unknown language")

// find the first compatible file
const file = env.files.find(
    ({ filename }) =>
        filename.endsWith("-strings.json") &&
        !filename.includes("jsdoc") &&
        !/_locales\/\w+\/[/]+-strings\.json/.test(filename)
)
if (!file) cancel("no strings file found")

// convert JSON to YAML as it typically works better with LLM tokenizers
const { filename, label, content } = file
const strings = JSON.parse(content)
// find the existing translation and remove existing translations
const trfn = path.join(
    path.dirname(filename),
    langCode,
    path.basename(filename)
)
const translated = parsers.JSON5(await fs.readFile(trfn))
if (translated) {
    for (const k of Object.keys(strings)) {
        if (translated[k]) {
            delete strings[k]
        }
    }
}

// shortcut: all translation is done
if (Object.keys(strings).length === 0) cancel(`no strings to translate`)

// use YAML for content as it work better with LLMs
// fix some makecode formatting issues
const contentToTranslate = YAML.stringify(strings).replace(
    /\n\* \`\`\`/g,
    "\n  ```"
)

// add to prompt context
def(
    "ORIGINAL",
    {
        filename,
        label,
        content: contentToTranslate,
    },
    { language: "yaml" }
)

// the prompt engineering piece
$`
## Role

You are an expert at Computer Science education. 
You are an expert TypeScript coder. 
You are an expert at Microsoft MakeCode.
You are an expert ${langName} translator.

## Task

Translate the documentation in ORIGINAL to ${langName} (lang-iso '${langCode}').
Write the translation to file "${trfn}" in JSON.

The ORIGINAL files are formatted in YAML where the key is an identifer and the value is the localized string.

EXAMPLE of ORIGINAL:
\`\`\`yaml
key1: localized value 1
key2: localized value 2
\`\`\`

## Recommendations

- DO NOT translate the keys
- DO translate the values to ${langName} (lang-iso '${langCode}')

### Block Strings

The value for keys ending with "|block" are MakeCode block strings (https://makecode.com/defining-blocks) and should be translated as such.

- Every variable name is prefixed with a '%' or a '$', like %foo or $bar.
- Do NOT translate variable names.
- Some variable names have a value, like '%foo=toggleOnOff'. The value should be NOT translated.
- All variables in the original string should be in the translated string.
- Make sure to translate '\\%' to '\\%' and '\\$' to '\\$' if they are not variables.
`

// merge the translations with the old one and marshal yaml to json
defFileMerge((filename, label, before, generated) => {
    if (!filename.endsWith("-strings.json")) return undefined
    const olds = JSON.parse(before || "{}")
    const news = JSON.parse(generated)
    // keep old translations
    Object.assign(olds, news)
    // return stringified json
    return JSON.stringify(olds, null, 2)
})
