---
title: Cancel
sidebar:
  order: 15
description: Learn how to immediately stop script execution with the cancel
  function in your automation scripts.
keywords: cancel function, script termination, stop execution, automation, script control
hero:
  image:
    alt: A small, pixelated computer screen displays a prominent red stop button,
      next to a simple script document marked with a cancel X, and an empty file
      tray, all rendered in flat 8-bit style with just five distinct colors, no
      people, no background, and no visible text. The composition gives a clean,
      symbolic sense of halted tasks and inactivity.
    file: ./cancel.png
llmstxt:
  content: >-
    The `cancel` function stops script execution immediately. It accepts an
    optional `reason` argument to explain why the script is being canceled.


    Example:

    ```js

    if (!env.files.length) cancel("Nothing to do")

    ```
  hash: 49f61026b963a56e07afb09dbd9850d9ca46e8d11d002c1059679040dd4d64e3

---

It is not uncommon that upon executing a script, you may want to cancel the execution of the script. This can be done using the `cancel` function. The `cancel` function takes an optional `reason` argument and will immediately stop the execution of the script.

```js
if (!env.files.length)
    cancel("Nothing to do")
```
