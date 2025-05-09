import { YouTube } from "astro-embed"

The GenAIScript extension for Visual Studio Code provides a convenient way to run scripts directly from the editor.

<YouTube id="https://youtu.be/dM8blQZvvJg" portraitQuality="high" />

There are mostly two ways of running scripts:

- running a script "directly". This scenario is useful when debugging a script
  or for a script that does not require any input files.
- running a script from input files or folders. This scenario is useful when you want to run a script on multiple files or folders.

## Running Scripts directly

- open a GenAIScript file in the editor
- right-click in the editor and select **Run GenAIScript\*** form the content menu
- or click on on the **Run GenAIScript** icon in the top right corner of the editor

This will start the script execution and use the default input files specify in the `script` `files` field.

```js 'files'
script({
    files: "...",
})
```

This mode is useful when developing script or for scripts that do not require any input files.

## Running Scripts from input files or folders

This mode allows to run scripts on any combination of files and folders, which will populate `env.files`.

### From the explorer window:

- select any files or folders in the explorer. You can use the `Ctrl` or `Shift` key to select multiple files or folders.
- right-click and select **Run GenAIScript** from the context menu

### From an editor

- open an file in the editor (not a GenAIScript file)
- right-click and select **Run GenAIScript** from the context menu

## Using the selected text in your script

Whenever you launch a script, GenAIScript will grab the selected text in the active text editor
and store in the `editor.selectedText` variable.

```js
const text = env.vars["editor.selectedText"]
```

If value will be undefined if you run your script from the command line,
so you should handle that case in your script.

## .gitignore rules

GenAIScript tries to respect the **top-level `.gitignore` rules in the project workspace** (it ignores nested .gitignore files).
This means that if you have a `.gitignore` file in your project, GenAIScript will ignore any files or folders that are ignored by Git.

There are exceptions to this rule:

- if you run **Run GenAIScript** on individual files, those files are not filtered by `.gitignore` since you explicitly chose them. Folders are always filtered.
- if you specify `---ignore-git-ignore` in the command line, GenAIScript will ignore the `.gitignore` file and run the script on all files and folders.