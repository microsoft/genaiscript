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
  "fr": "French",
  "es-ES": "Spanish",
  "de": "German",
  "sr": "Serbian",
  "vi": "Vietnamese",
  "it": "Italian"
}[langCode]
if (!langName)
  cancel('unknown language')

// grab the *-strings.json file, filter out the jsdoc files
// convert JSON to YAML as it typically works better with LLM tokenizers
const files = env.files.filter(({ filename }) => filename.endsWith("-strings.json") && !filename.includes("jsdoc"))
for (const { filename, label, content } of files) {
  const strings = JSON.parse(content)
  // find the existing translation and remove existing translations
  const trfn = path.join(path.dirname(filename), langCode, path.basename(filename))
  const translated = parsers.JSON5(await fs.readFile(trfn))
  if (translated) {
    for (const k of Object.keys(strings)) {
      if (translated[k]) {
        delete strings[k]
      }
    }
  }

  // use YAML for content as it work better with LLMs
  const contentToTranslate = YAML.stringify(strings).replace(/\* \`\`\`/g, "  ```")

  // add to prompt context
  def("ORIGINAL", {
    filename,
    label,
    content: contentToTranslate,
  }, { language: "yaml" })
}

// the prompt engineering piece
$`
## Role

You are an expert at Computer Science education. 
You are an expert TypeScript coder. 
You are an expert at Microsoft MakeCode.
You are an expert ${langName} translator.

## Task

Translate the documentation in ORIGINAL to ${langName} (lang-iso '${langCode}').
If the file is '<path>/foobar-strings.json', save the translation as '<path>/${langCode}/foobar-strings.json' in JSON.

The ORIGINAL files are formatted in YAML where the key is an identifer and the value is the localized string.

EXAMPLE:
\`\`\`yaml
key1: "localized value 1"
key2: "localized value 2"
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
`

// merge the translations with the old one and marshal yaml to json
defFileMerge((filename,
  label,
  before,
  generated) => {
  if (!filename.endsWith("-strings.json")) return undefined
  const olds = JSON.parse(before || "{}")
  const news = JSON.parse(generated)
  // keep old translations
  Object.assign(news, olds)
  // return stringified json
  return JSON.stringify(olds, null, 2)
})
