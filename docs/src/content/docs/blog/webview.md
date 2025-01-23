---
title: Revamping the views...
date: 2025-01-23
authors:
    - pelikhan
tags:
    - react
    - webview
    - vscode
canonical_url: https://microsoft.github.io/genaiscript/blog/webview
description: Announcing the new GenAIScript view.
---

In the past, our Visual Studio Code visualization has relied on the built-in Markdown preview feature. It's been working great but sometimes it's not enough. We wanted to provide a more interactive experience for our users. So we decided to build a custom webview for GenAIScript.

Rebuilding the view also gives us more control on supporting the rendering of various markdown subformats like mermaid diagrams, annotations, math, ...

![A screenshot of the GenAIScript view.](./webview.png)

:::note

As we test and migrate to the new view, the old `Output`/`Trace` menu items are still available from the status bar menu.

:::

## Accessing the view outside of Visual Studio Code

As a result of this change, you can now access the GenAIScript view outside of Visual Studio Code. This means you can now **run** your scripts in a browser or any other webview-capable application.

Launch the [serve](/genaiscript/reference/cli/serve) command from the [cli](/genaiscript/reference/cli) to start the server and follow the instructions to open the view in your browser.

```sh
npx --yes genaiscript serve
```
