Le red teaming pour les modèles de langage (LLM) est une méthode permettant de trouver des vulnérabilités dans les systèmes d'IA avant leur déploiement en utilisant des entrées adverses simulées. GenAIScript offre un support intégré pour [PromptFoo Red Team](https://www.promptfoo.dev/docs/red-team/).

:::caution
Le red teaming dans PromptFoo utilise des modèles LLM personnalisés pour générer des entrées adverses. Cette fonctionnalité repose sur le cloud Promptfoo.
:::

## Ajout du Red Teaming aux scripts

Ajoutez `redteam` à la fonction `script` pour activer le red teaming.

```js
script({
    redteam: {
        purpose: "You are a malicious user.",
    },
})
def("FILE", env.files)
$`Extract keywords from <FILE>`
```

La propriété `purpose` est utilisée pour guider le processus de génération d'attaques. Elle doit être aussi claire et spécifique que possible.
Incluez les informations suivantes :

* Qui est l'utilisateur et quelle est sa relation avec l'entreprise
* À quelles données l'utilisateur a accès
* À quelles données l'utilisateur n'a pas accès
* Quelles actions l'utilisateur peut effectuer
* Quelles actions l'utilisateur ne peut pas effectuer
* À quels systèmes l'agent a accès

## Plugins

[Les Plugins](https://www.promptfoo.dev/docs/red-team/plugins/) sont le système modulaire de Promptfoo pour tester une variété de risques et de vulnérabilités dans les modèles LLM et les applications alimentées par ces derniers.
Si aucun plugin n'est spécifié, GenAIScript permettra à PromptFoo d'utiliser l'ensemble `default` de plugins.

Cet exemple charge les plugins [OWASP Top 10 pour les modèles de langage](https://www.promptfoo.dev/docs/red-team/owasp-llm-top-10/).

```js
script({
    redteam: {
        plugins: "owasp:llm",
    },
})
```

## Stratégies

[Les Stratégies](https://www.promptfoo.dev/docs/red-team/strategies/) sont des techniques d'attaque qui explorent systématiquement les applications LLM à la recherche de vulnérabilités. Alors que les plugins génèrent des entrées adverses, les stratégies déterminent comment ces entrées sont livrées pour maximiser les taux de succès des attaques.

## Configuration

Il existe des limitations concernant les fournisseurs pris en charge pour exécuter le processus de Red Team (qui nécessite un accès LLM).

* Le grader nécessite un fournisseur OpenAI ou Azure OpenAI.
* Par défaut, la [génération à distance](https://www.promptfoo.dev/docs/red-team/configuration/#remote-generation) est désactivée (en utilisant la variable `PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION`).
  Si vous devez exécuter ce service activé, utilisez l'outil en ligne de commande `promptfoo` avec le fichier de configuration redteam généré.

## Voir aussi

* [Configuration](https://www.promptfoo.dev/docs/red-team/configuration/)
* [Résolution des problèmes](https://www.promptfoo.dev/docs/red-team/troubleshooting/attack-generation/)