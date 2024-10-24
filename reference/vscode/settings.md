
The following settings can be accessed through **Preferences: Open User Settings** command.

<!--
"genaiscript.diagnostics": {
    "type": "boolean",
    "default": false,
    "description": "Enable developer diagnostic mode. Including leaving terminals opened."
},
"genaiscript.cache": {
    "type": "boolean",
    "default": true,
    "description": "Enable or disables LLM request cache support."
},
"genaiscript.cli.version": {
    "type": "string",
    "description": "GenAIScript CLI version to use. Default matches the extension version."
},
"genaiscript.cli.path": {
    "type": "string",
    "description": "Path to GenAIScript CLI. Default uses npx."
}
-->

## CLI

These settings control how the GenAIScript server
is run from the extension.
By default, the extension uses [npx](https://www.npmjs.com/package/npx) and the current extension version to run the GenAIScript CLI.

```sh
npx --yes genaiscript@[extension_version] serve
```

## Path

If you have a specific version of the CLI installed, you can set the path to it here.

## Version

By default, the extension uses npx and the current extension version. You can override the version number with this setting.

```sh
node cli_path serve
```