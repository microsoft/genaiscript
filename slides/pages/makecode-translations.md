# Example: Translating MakeCode

Markdown + various custom macros and DSLs

````markdown
## {Step 6}

Click on the `||variables:Variables||` category in the Toolbox...

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() { ... })
```
````

Translations messes with the macros...

```markdown
## {Étape 6}

Cliquez sur le bouton ''||variables :Variables||'' dans la boîte à outils....

'''blocs
let main = 0 ;
input.onGesture(Gesture.Shake, function() {})
'''
```

---

## Develop the script in VSCode

Leverage the short dev loop to teach the format **iteratively** to the LLM.

```js
script({ parameters: { lang: "French" } })
// parameters
const { lang } = env.vars
// context
def("ORIGINAL", env.files[0], { language: "markdown" })
// role
$`You are an expert at Computer Science education. 
You are an expert at writing MakeCode documentation and tutorials. 
You are an expert ${lang} translator.`
// task
$`Translate the documentation in <ORIGINAL> to ${lang}.`
// Extra rules
$`- Do not translate header starting with ~
- Do NOT translate code in \`blocks\` or in \`typescript\` or in \`spy\` or in \`python\`.
- Do not translate @variable@ or @unplugged
- Translate \`## {<text>}\` as \`## {<translated text>}\`
- When you encounter a snippet like "\`\`||<namespace>:<text>||\`\`", DO NOT translate...

\`\`||<namespace>:<text>||\`\` --> \`\`||<namespace>:<translated text>||\`\`
...
`
```

---

## Automate with the CLI

- Scale the script using the CLI and google/zx.
- Validate with compilers, tests, ...

```js
import { run } from "genaiscript/api"
const langs = ["French", "German", ...]
const files = await glob("docs/**/*.md")
for(const lang of langs) {
    for(const file of files) {
        // run script and create translations
        await run(translate, file, { applyEdits: true, vars: { lang }})
        // run MakeCode compiler to validate translations
        await $`makecode check-docs ...`
        // upload the database
        await $`translation upload ...`
    }
}
```
