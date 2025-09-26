Les métadonnées sont une carte de paires clé-valeur utilisées pour activer les complétions stockées — une fonctionnalité dans OpenAI et [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/stored-completions) qui vous permet de stocker et de récupérer des complétions pour une invite donnée. Cela est utile pour les processus de distillation et d'évaluation.

![Une complétion enregistrée](../../../reference/scripts/stored-completions.png)

```js
script({
    metadata: {
        name: "my_script",
    },
})
```

Vous pouvez attacher jusqu'à 16 paires clé-valeur à un objet. Cela est utile pour stocker des informations supplémentaires sous un format structuré et pour interroger des objets via l'API ou le tableau de bord.

Les clés sont des chaînes de caractères d'une longueur maximale de 64 caractères. Les valeurs sont des chaînes de caractères d'une longueur maximale de 512 caractères.