
[Microsoft MakeCode](https://makecode.com) is a web-based platform 
for creating engaging computer science learning experiences. 
It provides a block-based programming environment that allows students 
to create games, animations, and interactive stories. 

The MakeCode documentation and tutorials uses [markdown with many additional macros
and micro syntaxes](https://makecode.com/writing-docs) 
to create rich-rendered tutorials and documentations, like the [Rock Paper Scissors tutorial](https://makecode.microbit.org/projects/rock-paper-scissors).

## Localization challenge

One major challenge in localizing the MakeCode resource is that 
tools like Bing Translator or Google Translate had the tendency to destroy the custom macro
annotation; thus breaking the rich rendering of the documentation.

Let's illustrate this with the Step 6 of the Rock Paper Scissors tutorial:

````markdown wrap
## {Step 6}

Click on the ``||variables:Variables||`` category in the Toolbox. Drag a ``||variables:hand||`` block out and drop it into the ``||logic:0 = 0||`` comparison block replacing the first **0**.  Click on the second 0 in the comparison block and change to **1**.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {
    	
    } else {
    	
    }
})
```
````

In this content, it is critical to keep the `||variables:hand||`
and `||logic:0 = 0||` annotations as they are. And also the `blocks` macro should be left untouched.

> Unfortunately, traditional translation system do not have a way to "teach" the syntax or emphasize
the importance of these annotations.

For example, when translated to French in Bing Translate, a number of errors are introduced:
` `` ` becomes `'`, extra whitespaces, `logic` becomes `logique`, and so forth.

````markdown wrap
## {Étape 6}

Cliquez sur le bouton ''||variables :Variables||'' dans la boîte à outils. Faites glisser un ''||variables :main||'' et déposez-le dans le fichier ''||logique :0 = 0||'' en remplacement du premier **0**.  Cliquez sur le deuxième 0 dans le bloc de comparaison et passez à **1**.

'''blocs
let main = 0 ;
input.onGesture(Gesture.Shake, function() {
    main = randint(1, 3)
    if (main == 1) {
    	
} else {
    	
}
})
'''
````

## Teaching the LLM how to translate

GenAIScript allowed to develop and automate a script that create high-quality LLM-based translations
for the MakeCode documentation.

A (simplified) version of the script is shown below and annotated with comments.

````js wrap
script({
    "title": "Translate MakeCode documentation",
    "group": "Translation",
    temperature: 0
})

// allow CLI argument injection
const langName = env.vars.lang || "French"

// context
const file = env.files[0]
def("ORIGINAL", file, { language: "markdown" })

// task
$`You are an expert at Computer Science education. 
You are an expert at writing MakeCode documentation and tutorials. 
You are an expert ${langName} translator.`

// task
$`Translate the documentation in ORIGINAL to ${langName}.

- Do not translate header starting with ~
- Do NOT translate code in \`blocks\` or in \`typescript\` or in \`spy\` or in \`python\`. However, you can should comments.
- Do not translate @variable@ or @unplugged
- Translate \`## {<text>}\` as \`## {<translated text>}\`
- When you encounter a snippet like "\`\`||<namespace>:<text>||\`\`", DO NOT translate <namespace> and DO translate text.

\`\`||<namespace>:<text>||\`\` --> \`\`||<namespace>:<translated text>||\`\`
...
`
````

Using this script, the translation of `Step 6` to French is as follows, and
you'll notice that all the errors have been solved.

````markdown wrap

## {Étape 6}

Cliquez sur la catégorie ``||variables:Variables||`` dans la boîte à outils. Faites glisser un bloc ``||variables:main||`` et déposez-le dans le bloc de comparaison ``||logic:0 = 0||``, en remplaçant le premier **0**. Cliquez sur le deuxième 0 dans le bloc de comparaison et changez-le en **1**.

```blocks
let main = 0;
input.onGesture(Gesture.Shake, function() {
    main = randint(1, 3)
    if (main == 1) {

    } else {

    }
})
```
````

## Automation

Note that we use `env.vargs.lang` [variable](/genaiscript/reference/scripts/variables) which allows to modify this value through the command line.

```js
const langName = env.vars.lang || "French"
```

Using the genaiscript CLI, we can run the script for each desired language in a GitHub Action.

```sh
npx genaiscript run translate ... --vars lang=German
```

### Validation and upload

The CLI can be automated using your favorite bash/script runtime.
For example, using [zx](https://google.github.io/zx/), we automate for a number of locales:

- translate documentation,
- save translation to files,
- run the MakeCode compiler to validate the translations
- upload/update translation to the translation database

```js wrap title="ai-translation.mjs"
const langs = ["French", "German", ...]
for(const lang of langs) {
    // run script and create translations
    await $`genaiscript run translate ... --vars lang=${lang} ... --apply-edits`
    // run MakeCode compiler to validate translations 
    await $`makecode check-docs ...`
    // upload the database
    await $`translation upload ...`
}
```