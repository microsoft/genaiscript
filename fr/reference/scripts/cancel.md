Il n'est pas rare que lors de l'exécution d'un script, vous souhaitiez annuler son exécution. Cela peut être fait en utilisant la fonction `cancel`. La fonction `cancel` prend un argument optionnel `reason` et arrêtera immédiatement l'exécution du script.

```js
if (!env.files.length)
    cancel("Nothing to do")
```