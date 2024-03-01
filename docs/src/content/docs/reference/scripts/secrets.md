---
title: Secrets
sidebar:
    order: 6
---

The `env.secrets` object is used to access secrets from the environment. The secrets are typically stored in the `.env` file in the root of the project (or in the `process.env` for the CLI).

You need to declare the list of secrets required in `script({ secrets: ... })`
in order to use them in the script.

```js
script({
    ...
    secrets: ["SECRET_TOKEN"]
})

const token = env.secrets.SECRET_TOKEN
```
