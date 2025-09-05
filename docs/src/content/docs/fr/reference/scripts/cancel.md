---
title: Annuler
sidebar:
  order: 15
description: Apprenez à arrêter immédiatement l'exécution d'un script avec la
  fonction cancel dans vos scripts d'automatisation.
keywords: cancel function, script termination, stop execution, automation, script control
hero:
  image:
    alt: A small, pixelated computer screen displays a prominent red stop button,
      next to a simple script document marked with a cancel X, and an empty file
      tray, all rendered in flat 8-bit style with just five distinct colors, no
      people, no background, and no visible text. The composition gives a clean,
      symbolic sense of halted tasks and inactivity.
    file: ../../../reference/scripts/cancel.png

---

Il n'est pas rare que lors de l'exécution d'un script, vous souhaitiez annuler son exécution. Cela peut être fait en utilisant la fonction `cancel`. La fonction `cancel` prend un argument optionnel `reason` et arrêtera immédiatement l'exécution du script.

```js
if (!env.files.length)
    cancel("Nothing to do")
```
