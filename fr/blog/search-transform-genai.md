import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

Avez-vous déjà été confronté à une situation où vous devez rechercher dans plusieurs fichiers de votre projet, trouver un motif spécifique, puis lui appliquer une transformation ? Cela peut être une tâche fastidieuse, mais ne vous inquiétez pas ! Dans cet article de blog, je vais vous présenter un script GenAIScript qui fait exactement cela, automatisant le processus et vous faisant gagner du temps. 🕒💡

Par exemple, lorsque GenAIScript a ajouté la possibilité d'utiliser une chaîne de commande sous forme de chaîne de caractères dans
le commande `exec`, nous avons dû convertir tout script utilisant

```js
host.exec("cmd", ["arg0", "arg1", "arg2"]);
```

en

```js
host.exec(`cmd arg0 arg1 arg2`)`
```

Le guide [Search And Transform](../../guides/search-and-transform/) couvre les détails de cette nouvelle approche...