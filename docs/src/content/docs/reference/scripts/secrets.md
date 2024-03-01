---
title: Secrets
sidebar:
    order: 6
---

The `env.secrets` object is used to access secrets from the environment. The secrets are typically stored in the `.env` file in the root of the project (or in the `process.env` for the CLI).

You need to declare the list of secrets required in `script({ secrets: ... })`
in order to use them in the script.

```txt title=".env"
SECRET_TOKEN="..."
...
```

-  declare use in `script`

```js
script({
    ...
    secrets: ["SECRET_TOKEN"]
})
```
-  access the secret in the script through `env.secrets`

```js
const token = env.secrets.SECRET_TOKEN
...
```
