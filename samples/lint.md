
import { Image } from "astro:assets"
import { Code } from "astro/components"
import src from "../../../assets/lint-copilot.png"
import alt from "../../../assets/lint-copilot.png.txt?raw"
import code from "../../../../../packages/sample/genaisrc/lint.genai.mjs?raw"

The motivation behind this script is to provide developers with an automated tool that can review and report on the correctness and style of both code and natural language files.
It leverages the power of LLM to inspect code or documents in new ways.

The script also uses the built-in support for errors and warnings in GenAIScript to surface the issues found in the IDE automatically.

<Image src={src} alt={alt} loading="lazy" />

### Script Breakdown

Below is a step-by-step explanation of the script:

```ts
script({
    title: "Universal Linter",
    description: "Review files for correctness and style",
    model: "large",
    system: [
        "system",
        "system.assistant",
        "system.annotations",
        "system.safety_jailbreak",
        "system.safety_harmful_content",
    ],
})
```

-   **`script({...})`**: This function initializes a GenAI script.
-   **`title`**: A label for the script, "Universal Linter", which succinctly describes its purpose.
-   **`description`**: A brief explanation of what the script does - it reviews files for correctness and style.
-   **`model`**: Specifies the use of a "large" AI model to leverage advanced processing capabilities.
-   **`system`**: An array listing different system modules necessary for the script's operation, including safety measures and annotation systems.

The script also contains a prompt block:

```ts wrap
$`## Task

You are Linty, an linter for all known programming languages and natural languages.
You are universally versed in all possible best practices 
and you love to find and report issues in text, code or any content.

Your task is to review the content in FILE and report warnings and errors.

## Rules

- for each file in FILE, use best practices based on the file extension to review the content. For example, for a ".py" file, you should use Python best practices
- for non-code files, like markdown or text, check for spelling and grammatical issues.
- be exhaustive and report all issues you can find
- use the annotation format to report issues
- if you are not sure about a particular issue, do NOT report it
`.role("system")
```

-   **`$``Task`**: Begins a prompt section where the AI's task is defined.
-   **`You are Linty...`**: Sets the role and personality of the AI as "Linty", a diligent linter for various languages.
-   **`Your task...`**: Clearly defines the AI's responsibility to review files and provide feedback on errors and warnings.
-   **`Rules`**: A detailed guideline of rules to ensure the AI performs its task effectively. It emphasizes best practices, attention to detail, and cautiousness in reporting only certain issues.

Finally, the script specifies files to be processed:

```ts
def("FILE", env.files, { lineNumbers: true })
```

-   **`def("FILE", env.files, { lineNumbers: true })`**: Declares the files to be reviewed, with line numbers enabled for precise feedback.

### Running the Script

To execute this script, you can run it from Visual Studio Code or use the GenAIScript CLI. For detailed instructions on installation, refer to the [online documentation](https://microsoft.github.io/genaiscript/getting-started).

```bash
npx --yes genaiscript run lint <file1> <file2> ...
```

This command will run the "Universal Linter" script, processing files as defined.

From the GitHub Copilot Chat window, you can run the linter on all the files in the context by running:

```sh
@genaiscript /run lint
```

## Full Source

The full source code is available at [https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/lint.genai.mts](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/lint.genai.mts).

<Code code={code} wrap={true} lang="ts" title="lint.genai.mts" />
