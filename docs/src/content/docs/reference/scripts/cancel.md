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

---

It is not uncommon that upon executing a script, you may want to cancel the execution of the script. This can be done using the `cancel` function. The `cancel` function takes an optional `reason` argument and will immediately stop the execution of the script.

```js
if (!env.files.length)
    cancel("Nothing to do")
```
