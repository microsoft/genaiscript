script({
    title: "MakeCode Blocks Localization Env",
    description: "Translate block strings that define blocks in MakeCode",
    group: "MakeCode",
    temperature: 0,
    system: [],
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
const trsrc = await workspace.readText(trfn)
const translated = parsers.JSON5(trsrc) || {}
for (const k of Object.keys(strings)) if (translated[k]) delete strings[k]

// shortcut: all translation is done
if (Object.keys(strings).length === 0) cancel(`no strings to translate`)

// use simple .env format key=value format
Object.keys(strings).forEach(
    (k) => (strings[k] = strings[k].replace(/(\.|\n).*/s, ".").trim())
)
const contentToTranslate = INI.stringify(strings)

// the prompt engineering piece
$`
## Role

You are an expert at Computer Science education. 
You are an expert TypeScript coder. 
You are an expert at Microsoft MakeCode.
You are an expert ${langName} translator.

## Task

Translate the content of ORIGINAL to ${langName} (lang-iso '${langCode}').
The ORIGINAL files are formatted as a .env file.

Write the translation as a .env format to the output. 
- Do NOT add markdown formatting.
- ALWAYS add quotes around values


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
$`ORIGINAL:
${contentToTranslate}
`

defOutputProcessor(async (o) => {
    const news = INI.parse(o.text)
    Object.assign(translated, news)
    return {
        files: {
            [trfn]: JSON.stringify(translated, null, 2),
        },
    }
})
