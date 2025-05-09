import { YouTube } from "astro-embed"
import copilotSrc from "../../../assets/chat-participant.png"
import copilotAlt from "../../../assets/chat-participant.png.txt?raw"
import { Image } from "astro:assets"

:::caution

Script are executed in the context of your environment.
**Only run trusted scripts.**

:::

## Visual Studio Code

In Visual Studio Code, the location where you start running a script determines the entries in the [`env.files`](/genaiscript/reference/scripts/context) variable.

<YouTube id="https://youtu.be/dM8blQZvvJg" portraitQuality="high" />

### Single file

- Right click on a file in the Explorer and select **Run GenAIScript...**.
- Or right click in a file editor and select **Run GenAIScript...**.

The `env.files` array will contain a single element with the selected file.

![A file explorer window shows various files and folders. The file "Document.docx" is selected, and a context menu is open with the option "Run GenAIScript..." highlighted.](../../../assets/vscode-file-run.png)

### Folder

- Right click on a folder in the Explorer and select **Run GenAIScript...**s.

The `env.files` array will contain all nested files under that folder.

![The image shows a file explorer with a context menu. The "rag" folder is expanded, displaying files like "Document.docx." The context menu includes options like "New File," "Cut," "Copy," and "Run GenAIScript."](../../../assets/vscode-folder-run.png)

:::tip[Root folder]

To run the script on the root folder, right click under the files.

![A screenshot of a file explorer in a code editor showing various files and folders. The context menu is open with the option "Run GenAIScript..." highlighted by a red arrow.](../../../assets/vscode-folder-run-root.png)

:::

### GitHub Copilot Chat

You can run scripts in the [GitHub Copilot Chat](https://code.visualstudio.com/docs/copilot/getting-started-chat) through the [**@genaiscript**](/genaiscript/reference/vscode/github-copilot-chat) participant.

<Image src={copilotSrc} alt={copilotAlt} loading="lazy" />

### Default files

You can specify default file or files to run the script on.
When you run the script from the script file itself, or with the command line without file arguments,
the default files will be used.

```js
script({
    files: "path/to/files*.md",
})
...
```

### Tasks

The GenAIScript extension exposes each script as a [Task](https://code.visualstudio.com/docs/editor/tasks) automatically.

The task launches the [cli](/genaiscript/reference/cli) and runs the selected script and pass the path to the current opened editor.

- Open the command palette `Ctrl+Shift+P` and search "Tasks: Run Task"
- Select the `genaiscript` task provider
- Select the script you want to run

:::note

When running a script as a task, the result will not be visible in the GenAIScript trace window.

:::

### Analyze results

By default, GenAIScript opens the output preview which shows a rendered view
of the LLM output (assuming the LLM produces markdown).

The GenAIScript view provides an overview of the trace of the latest run.

You can also use the **Trace** to review the each transformation
step of the script execution.

- Click on the GenAIScript status bar icon to various options to
  investigate results.

![A code editor displaying a JSON array with city data, including names, populations, and Wikipedia URLs. A toolbar at the top shows options like "Retry," "Output," and "Trace." The bottom right corner indicates "150 tokens."](../../../assets/vscode-statusbar-trace.png)

## Command Line

Start by creating a script using the [command line](/genaiscript/reference/cli).

- JavaScript

```sh
npx genaiscript scripts create proofreader
```

- TypeScript "--typescript"

```sh
npx genaiscript scripts create proofreader --typescript
```

The `scripts create` command also drops a TypeScript definition file (`genaiscript.d.ts` and `tsconfig.json`) to enable type checking and auto-completion
in your editor. If you need to regenerate the TypeScript definition file, use the `scripts fix`

```sh
npx genaiscript scripts fix
```

Use the [run](/genaiscript/reference/cli/run) command to execute a script from the command line.

```sh
npx genaiscript run proofreader path/to/files*.md
```

:::tip

If you plan to use the [command line](/genaiscript/reference/cli) extensively,
it's probably best to install it locally as `npx` startup time can be slow.

- as a development dependency

```sh
npm install -D genaiscript
```

- as a global package

```sh
npm install -g genaiscript
```

:::

You can start a [playground](/genaiscript/reference/playground)
to interactively run scripts through a similar web interface
as the Visual Studio Code extension.

```sh
npx genaiscript serve
```

## Next steps

[Debug](/genaiscript/getting-started/debugging-scripts) your scripts using the Visual Studio Code Debugger!

## Other integrations

These are not actively maintained by the GenAIScript team, but we try to make them work
as much as possible. If you find dragons, please report the issues.

### Cursor

GenAIScript can be installed in [Cursor](https://cursor.sh/how-to-install-extension)
using the manual installation steps.

### [Neovim](https://neovim.io/)

The [genaiscript-runner.nvim](https://github.com/ryanramage/genaiscript-runner.nvim) project
provides a plugin to run GenAIScript scripts.