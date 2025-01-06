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

## API key

The API key is used to authenticate the requests to the server.
You can specify an API key by setting the `--api-key` flag or the `GENAISCRIPT_API_KEY` environment variable.

```bash
npx genaiscript serve --api-key my-api-key
```

or

```txt title=".env"
GENAISCRIPT_API_KEY=my-api-key
```

The API key can be set in the `Authorization` header of a request or in the URL query parameter `api-key`.

- http://localhost:8003/?api-key=my-api-key

## CORS

You can enable [Cross Origin Shared Resource](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) by setting the `--cors` flag.

```bash
npx genaiscript serve --cors
```

By default, the origin is set to `*`. You can specify the origin by setting the `GENAISCRIPT_CORS_ORIGIN` environment variable.
