script({
    title: "MakeCode Blocks Localization",
    description: "Translate block strings that define blocks in MakeCode",
    group: "MakeCode",
    temperature: 0,
})

// language parameterization
const langCode = (env.vars.lang || "de") + ""

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

// assume we've been pointed at the .json file
const file = env.files[0]
if (!file) cancel("no strings file found")

const { filename, content } = file
const dir = path.dirname(filename)

// read the stings, which are stored as a JSON record
const strings = JSON.parse(content)

// find the existing translation and remove existing translations
const trfn = path.join(dir, langCode, path.basename(filename))
const translated = await workspace.readJSON(trfn)
if (translated)
    for (const k of Object.keys(strings)) if (translated[k]) delete strings[k]

// shortcut: all translation is done
if (Object.keys(strings).length === 0) cancel(`no strings to translate`)

// use simple .env format key=value format
const contentToTranslate = Object.entries(strings)
    .map(([k, v]) => `${k}=${v.replace(/(\.|\n).*/s, ".").trim()}`)
    .join("\n")

// the prompt engineering piece
$`
## Role

You are an expert at Computer Science education. 
You are an expert TypeScript coder. 
You are an expert at Microsoft MakeCode.
You are an expert ${langName} translator.

## Task

Translate the content of ORIGINAL to ${langName} (lang-iso '${langCode}').
The ORIGINAL files are formatted with one key and localized value pair per line as follows.

\`\`\`
key1=en value1
key2=en value2
...
\`\`\`

Write the translation to file ${trfn} formatted with one key and localized value pair per line as follows (DO NOT use JSON).

\`\`\` file="${trfn}"
key1=${langCode} value1
key2=${langCode} value2
...
\`\`\`


## Recommendations

- DO NOT translate the keys
- DO translate the values to ${langName} (lang-iso '${langCode}')
- DO NOT use foul language.

### Block Strings

The value for keys ending with "|block" are MakeCode block strings (https://makecode.com/defining-blocks)
and should be translated following these rules:

- Every variable name is prefixed with a '%' or a '$', like %foo or $bar.
- Do NOT translate variable names.
- Some variable names have a value, like '%foo=toggleOnOff'. The value should be NOT translated.
- All variables in the original string should be in the translated string.
- Make sure to translate '\\%' to '\\%' and '\\$' to '\\$' if they are not variables.
- Event string starts with 'on', like 'on pressed'. Interpret 'on' as 'when' when, like 'when pressed', when translating.
- The translations of "...|block" string should be short.

`

// add to prompt context
def(
    "ORIGINAL",
    {
        filename,
        content: contentToTranslate,
    },
    { language: "txt" }
)

// merge the translations with the old one and marshal yaml to json
defFileMerge((filename, label, before, generated) => {
    if (!filename.endsWith("-strings.json")) return undefined

    // existing translatins
    const olds = JSON.parse(before || "{}")

    // parse out kv
    const news = generated
        .split(/\n/g)
        .map((line) => /^([^=]+)=(.+)$/.exec(line))
        .filter((m) => !!m)
        .reduce((o, m) => {
            const [, key, value] = m
            // assign
            o[key] = value
            return o
        }, {})

    // merge new translations with olds ones
    Object.assign(olds, news)

    // return stringified json
    return JSON.stringify(olds, null, 2)
})
