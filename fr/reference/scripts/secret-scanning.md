On ne devrait pas avoir de secrets dans sa base de code, mais parfois cela arrive.
Pour vous aider à éviter cela, nous avons une fonctionnalité d'analyse des secrets qui scannera votre base de code à la recherche de secrets
et vous avertira si certains sont trouvés.

:::note
La fonctionnalité d'analyse des secrets n'est en aucun cas exhaustive et ne doit pas être considérée comme la seule méthode
pour sécuriser votre base de code. C'est une fonctionnalité basée sur le meilleur effort qui vous aidera à éviter les erreurs communes.
:::

## Motifs pris en charge

Par défaut, l'ensemble des motifs de secrets est presque vide et défini à l'adresse [https://github.com/microsoft/genaiscript/tree/main/packages/core/src/config.json](https://github.com/microsoft/genaiscript/tree/main/packages/core/src/config.json).

:::caution
Cette liste n'est pas complète par conception, et doit être mise à jour afin de correspondre à vos besoins.
:::

Vous pouvez trouver des exemples de motifs à [https://github.com/mazen160/secrets-patterns-db/](https://github.com/mazen160/secrets-patterns-db/).

## Messages analysés

Par défaut, tous les messages envoyés aux LLM sont scannés et expurgés si ils contiennent des secrets.

Vous pouvez désactiver complètement l'analyse des secrets en définissant l'option `secretScanning` à `false` dans votre script.

```js
script({
    secretScanning: false,
})
```

## Configuration des motifs

Si vous avez un motif spécifique que vous souhaitez rechercher, vous pouvez le configurer dans votre
[fichier de configuration](../../../reference/reference/configuration-files/).

```json title="genaiscript.config.json"
{
    "secretPatterns": {
        ...,
        "my secret pattern": "my-secret-pattern-regex"
    }
}
```

* * ne pas utiliser `^` ou `$` dans votre motif regex

### Désactivation des motifs

Attribuez la valeur `null` ou `false` à la clé du motif pour le désactiver.

```json title="genaiscript.config.json"
{
    "secretPatterns": {
        "OpenAI API Key": null
    }
}
```

## CLI

Vous pouvez tester vos motifs sur des fichiers en utilisant la CLI.

```sh
genaiscript parse secrets *
```