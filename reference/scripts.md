import { FileTree } from "@astrojs/starlight/components"
import DirectoryLinks from '../../../../components/DirectoryLinks.astro';

GenAIScript are JavaScript files named as `*.genai.mjs`, or TypeScript files named as `*.genai.mts`,
with a prompt creation engine designed by LLM prompting.

```js title="shorten.genai.mjs"
script({
    title: "Shorten", // displayed in UI and Copilot Chat
    // also displayed but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
})

// but the variable is appropriately delimited
const file = def("FILE", env.files)

// this appends text to the prompt
$`Shorten ${file}. Limit changes to minimum.`
```

## Script files

-   GenAIScript will detect any file matching `*.genai.mjs`, `*.genai.js`, 
    `*.genai.mts` in your workspace.
-   GenAIScript files can be placed anywhere in your workspace; 
    but the extension will place them in a `genaisrc` folder by default.
-   `.genai.mjs` use module JavaScript syntax and support [imports](/genaiscript/reference/scripts/imports). 
-   `.genai.js` are eval-ed and do not support imports.
-   `.genai.mts` are [TypeScript module files](/genaiscript/resources/scripts/typescript) and support [imports](/genaiscript/reference/scripts/imports), 
    including dynamic imports of other TypeScript files.

<FileTree>

- /genaisrc
  - jsconfig.json     // TypeScript compiler configuration
  - genaiscript.d.ts  // TypeScript definitions 
  - myscript.genai.mjs // your script!
  - ...

</FileTree>

-   `system.*.genai.mjs` are considered [system prompt templates](/genaiscript/reference/scripts/system)
    and are unlisted by default.


## Topics

<DirectoryLinks directory="reference/scripts" />