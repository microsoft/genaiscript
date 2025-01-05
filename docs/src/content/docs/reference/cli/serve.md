---
title: Serve
description: Launch local web server.
sidebar:
    order: 2
---

Launch a local web server that is used to run the playground
or Visual Studio Code.

Run from the workspace root:

```bash
npx genaiscript serve
```

## port

The default port is `8003`. You can specify the port by setting the `--port` flag.

```bash
npx genaiscript serve --port 8004
```

## CORS

You can enable [Cross Origin Shared Resource](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) by setting the `--cors` flag.

```bash
npx genaiscript serve --cors
```

By default, the origin is set to `*`. You can specify the origin by setting the `GENAISCRIPT_CORS_ORIGIN` environment variable.
