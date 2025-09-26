Exécute les tests dans les scripts en utilisant [promptfoo](https://www.promptfoo.dev/).

```bash
genaiscript test "<scripts...>"
```

Vous pouvez remplacer les modèles utilisés dans les tests avec `--models` :

```bash "--models openai:gpt-4 ollama:phi3"
genaiscript test "<scripts...>" --models openai:gpt-4 ollama:phi3
```

:::note
Cette fonctionnalité nécessite d’ajouter `@genaiscript/api` aux dépendances de votre `package.json`.
:::

## visualiseur de résultats

Exécutez la commande `test view` pour lancer le visualiseur des résultats de test :

```bash
npx genaiscript test view
```