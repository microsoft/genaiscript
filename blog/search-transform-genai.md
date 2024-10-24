
Have you ever found yourself in a situation where you need to search through multiple files in your project, find a specific pattern, and then apply a transformation to it? It can be a tedious task, but fear not! In this blog post, I'll walk you through a GenAIScript that does just that, automating the process and saving you time. 🕒💡

For example, when GenAIScript added the ability to use a string command string in
the `exec` command, we needed to convert all script using

```js
host.exec("cmd", ["arg0", "arg1", "arg2"])
```

to

```js
host.exec(`cmd arg0 arg1 arg2`)`
```

The [Search And Transform guide](/genaiscript/guides/search-and-transform) covers the detail on this new approach...
