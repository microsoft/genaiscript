---
title: Stored Completions
description: Metadata for the script
keywords: [metadata, script]
sidebar:
    order: 110
---

Metadata is a map of key-value pairs that is used to enable stored completions. A feature in OpenAI and Azure OpenAI that allows you to store and retrieve completions for a given prompt. This is used for distillation and evaluation purposes.

```js
script({
    metadata: {
        name: "my_script",
    },
})
```

Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format, and querying for objects via API or the dashboard.

Keys are strings with a maximum length of 64 characters. Values are strings with a maximum length of 512 characters.
