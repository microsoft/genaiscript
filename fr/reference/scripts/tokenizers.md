Le module d'aide `tokenizers` fournit un ensemble de fonctions pour diviser le texte en tokens.

```ts
const n = tokenizers.count("hello world")
```

## Choisir votre tokeniseur

Par défaut, le module `tokenizers` utilise le tokeniseur `large`. Vous pouvez changer de tokeniseur en passant l'identifiant du modèle.

```ts 'model: "gpt-4o-mini"'
const n = await tokenizers.count("hello world", { model: "gpt-4o-mini" })
```

## `count`

Compte le nombre de tokens dans une chaîne de caractères.

```ts wrap
const n = await tokenizers.count("hello world")
```

## `truncate`

Supprime une partie de la chaîne pour respecter un budget de tokens

```ts wrap
const truncated = await tokenizers.truncate("hello world", 5)
```

## `chunk`

Divise le texte en segments d'une taille de tokens donnée. Le segment essaie de trouver des frontières de découpage appropriées en fonction du type de document.

```ts
const chunks = await tokenizers.chunk(env.files[0])
for(const chunk of chunks) {
    ...
}
```

Vous pouvez configurer la taille des segments, le chevauchement et ajouter des numéros de ligne.

```ts wrap
const chunks = await tokenizers.chunk(env.files[0], {
    chunkSize: 128,
    chunkOverlap 10,
    lineNumbers: true
})
```