---
title: Secrets
description: Learn how to securely access and manage environment secrets in your
  scripts with env.secrets object.
keywords: secrets management, environment variables, secure access, .env file,
  script configuration
sidebar:
  order: 16
hero:
  image:
    alt: A flat, 2D computer screen icon in a geometric 8-bit style shows a minimal
      rectangular file, meant to represent an environment (.env) file, with a
      padlock symbol in front of it to suggest security. Beside this, there are
      clear, overlapping code brackets and a key symbol placed within a circle.
      The design uses only five solid corporate colors, is clean and iconic, and
      fits within a small square with no text, background, people, or shadows.
    file: ./secrets.png

---

The `env.secrets` object is used to access secrets from the environment. The secrets are typically stored in the `.env` file in the root of the project (or in the `process.env` for the CLI).

You must declare the list of required secrets in `script({ secrets: ... })`
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
