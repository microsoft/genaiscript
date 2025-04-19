---
title: Cancel
sidebar:
  order: 15
description: Learn how to immediately stop script execution with the cancel function in your automation scripts.
keywords: cancel function, script termination, stop execution, automation, script control
---

It is not uncommon that upon executing a script, you may want to cancel the execution of the script. This can be done using the `cancel` function. The `cancel` function takes an optional `reason` argument and will immediately stop the execution of the script.

```js
if (!env.files.length)
    cancel("Nothing to do")
```
