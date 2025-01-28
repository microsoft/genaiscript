---
title: User settings
sidebar:
    order: 200
description: Customize your VSCode experience with GenAIScript user settings for diagnostics, caching, and CLI configurations.
keywords: VSCode settings, user preferences, CLI path, extension configuration, diagnostics toggle
---

The following settings can be accessed through **Preferences: Open User Settings** command.

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

## Hide Server Terminal

By default, the GenAIScript server terminal is hidden after the server is started. Turning on this flag will open a terminal where you can inspect the GenAIScript server logs.

## Diagnostics

This flag enables a variety of additional logging and behaviors to help diagnose issues with the GenAIScript server.