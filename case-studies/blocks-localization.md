
import { Code } from "@astrojs/starlight/components"
import stringsJson from "../../../../../packages/sample/src/makecode/jacdac-buzzer-strings.json?raw"
import scriptSource from "../../../../../packages/sample/src/makecode/makecode-loc.genai.js?raw"

This is another instance of using the LLM to produce translation of natural strings with an embedded DSL, similarly to the [Documentation Translation](./documentation-translations.mdx) guide.

[MakeCode](https://makecode.com) uses a [microformat](https://makecode.com/defining-blocks) to define the shape of coding blocks.
When translating the format strings, it is critical to converse the properties of the blocks, such as the number of arguments, 
their types, and the order of the arguments.

## Don't break the blocks!

The [localization strings](https://github.com/microsoft/pxt-jacdac/blob/45d3489c0b96ed0f74c9bbea53fb0714ae9f7fcc/buzzer/_locales/jacdac-buzzer-strings.json#L1) for the buzzer library are:

<Code title="jacdac-buzzer-strings.json" code={stringsJson} wrap={true} lang="json" />

For example, the string for the [Jacdac buzzer play tone block](https://github.com/microsoft/pxt-jacdac/blob/45d3489c0b96ed0f74c9bbea53fb0714ae9f7fcc/buzzer/_locales/jacdac-buzzer-strings.json#L5-L6) 
contains reference to variables (`%music`) that should be maintained in the translated string.

```json
{
    ...
    "modules.BuzzerClient.playTone|block": 
        "play %music tone|at %note|for %duration",
    ...
}
```

and Bing Translate gives us the following translation

```txt title="Bing Translator"
%Musikton|bei %Note|für %Dauer abspielen
```

As one can see, bing translated the `%variable` name which will break the block definition.

The [GenAIScript translation](https://github.com/microsoft/pxt-jacdac/blob/45d3489c0b96ed0f74c9bbea53fb0714ae9f7fcc/buzzer/_locales/de/jacdac-buzzer-strings.json#L5) is correct.

```txt title="GenAIScript"
spiele %music Ton|bei %note|für %duration
```
If you look closely in the script source, you will find guidance in the prompt to properly
handle the variables.

```js title="block-translator.genai.mjs"
$`...
- Every variable name is prefixed with a '%' or a '$', like %foo or $bar.
- Do NOT translate variable names.
...
`
```

## Custom data format

Another challenge with translations is that the localized string often 
contain escaped characters that break formats like JSON or YAML. 
Therefore, we use a custom simple `key=value` format
to encode the strings, to avoid encoding issues. 
We use the `defFileMerge` feature to convert the parse key-value file, and merge them with the existing translations.


```js title="block-translator.genai.mjs"
// register a callback to custom merge files
defFileMerge((filename, label, before, generated) => {
    if (!filename.endsWith("-strings.json")) return undefined

    // load existing translatins
    const olds = JSON.parse(before || "{}")

    // parse out key-value lines into a JavaScript record object
    const news = generated
        .split(/\n/g)
        .map(line => /^([^=]+)=(.+)$/.exec(line))
        .filter(m => !!m)
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
```

## Parameterization for Automation

The language code `langCode` is pulled from [variables](/genaiscript/reference/scripts/variables) `env.vars` or defaulted to `de`.

```js
const langCode = env.vars.lang || "de"
```

This technique allows to reconfigure these variables from the command line
using the `--vars lang=fr` argument.

## Script

The full script is show below.

<Code code={scriptSource} title="block-translator.genai.mjs" wrap={true} lang="js" />

The result from this script can be inspected 
in this [pull request](https://github.com/microsoft/pxt-jacdac/pull/108).