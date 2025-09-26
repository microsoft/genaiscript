# Différences

Dans GenAIScript, l'utilitaire `system.diff` génère des **différences de fichiers concises** pour une comparaison et des mises à jour efficaces. Ceci est particulièrement utile pour le contrôle de version ou pour effectuer des modifications précises dans les fichiers. Découvrez comment créer ces diffs et les meilleures pratiques pour les interpréter.

## Points clés

* Les diff mettent en avant uniquement les lignes modifiées.
* Conserve un minimum de lignes non modifiées pour le contexte.
* Utilise une syntaxe intuitive adaptée aux gros fichiers comportant de petits changements.

## Syntaxe DIFF

### Consignes :

* **Lignes existantes** : Commencent par leur **numéro de ligne d’origine**.
* **Lignes supprimées** : Commencent par `-` suivi du numéro de ligne.
* **Lignes ajoutées** : Précédées de `+` (sans numéro de ligne).
* Les lignes supprimées **doivent exister**, tandis que les lignes ajoutées doivent être **nouvelles**.
* Préservez l’indentation et concentrez-vous sur un minimum de lignes non modifiées.

## Exemple de diff

Voici un exemple du format diff :

```diff
[10]  const oldValue = 42;
- [11]  const removed = 'This line was removed';
+ const added = 'This line was newly added';
[12]  const unchanged = 'This line remains the same';
```

### Meilleures pratiques pour générer des diffs :

1. Limitez les lignes non modifiées autour à **2 lignes** maximum.
2. **Omettez les fichiers inchangés** ou les lignes identiques.
3. Concentrez-vous sur des modifications concises pour plus d’efficacité.

## Référence API

Lorsque vous générez des diff dans votre script, utilisez `system.diff` pour des comparaisons simplifiées. Voici un exemple :

```js
system({
    title: "Generate concise diffs",
});

export default function (ctx) {
    const { $ } = ctx;
    $`## DIFF file format`;
}
```

## Documentation en ligne

Pour plus de détails sur `system.diff`, consultez la [documentation en ligne](https://microsoft.github.io/genaiscript/).