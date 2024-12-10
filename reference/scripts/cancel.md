
It is not uncommon that upon executing a script, you may want to cancel the execution of the script. This can be done using the `cancel` function. The `cancel` function takes an optional `reason` argument and will immediately stop the execution of the script.

```js
if (!env.files.length)
    cancel("Nothing to do")
```
