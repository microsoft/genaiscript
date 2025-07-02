---
title: Git
description: Utilitaires Git pour les opérations sur les dépôts
sidebar:
  order: 51
hero:
  image:
    alt: An 8-bit style, two-dimensional file directory icon features branching
      lines with geometric nodes to represent git branches, a small gear for
      settings, and a tag icon for version tags. A directional arrow points
      toward a repository box to indicate shallow cloning, while a dashed
      outline marks an ignored file. The artwork uses five solid corporate
      colors in a flat, minimalist design with no background or gradients,
      created for a 128x128 size.
    file: ../../../reference/scripts/git.png

---

L’assistant `git` fournit une fine couche d’abstraction autour de l’appel de l’exécutable [git](https://git-scm.com/) pour les opérations sur les dépôts.

## Méthodes

### defaultBranch

Résout la branche par défaut, généralement `main` ou `master`, dans le dépôt.

```typescript
const df = await git.defaultBranch()
```

### lastTag

Récupère le dernier tag dans le dépôt.

```typescript
const tag = await git.lastTag()
```

### branch

Récupère la branche courante du dépôt.

```typescript
const branchName = await git.branch()
```

### exec

Exécute une commande git dans le dépôt et retourne la sortie standard.

```typescript
const output = await git.exec(["status"])
```

### listBranches

Liste les branches du dépôt git.

```typescript
const branches = await git.listBranches()
```

### listFiles

Recherche des fichiers spécifiques dans le dépôt git.

```typescript
const files = await git.listFiles("modified")
```

### diff

Obtient le diff pour l’état actuel du dépôt.

```typescript
const diffOutput = await git.diff({ staged: true })
```

### log

Liste les commits du dépôt git.

```typescript
const commits = await git.log()
```

## Configuration des ignores

Étant donné que GenAIScript utilise git, il prend déjà en charge les instructions du fichier `.gitignore`. Vous pouvez également fournir des exclusions additionnelles à l’échelle du dépôt via le fichier `.gitignore.genai` à la racine de l’espace de travail.

```txt title=".gitignore.genai"
**/genaiscript.d.ts
```

## Clonages superficiels

Vous pouvez créer des clonages superficiels mis en cache de dépôts pour travailler sur plusieurs dépôts.
La méthode `shallowClone` retourne une instance client `git`.

Les clones sont créés dans le répertoire `.genaiscript/git/...` et sont mis en cache selon l’information `repository/branch/commit`.

```js
const clone = await git.shallowClone("microsoft/genaiscript")
```

Vous pouvez fournir des options pour forcer le clonage
et/ou exécuter la commande `install` après le clonage.

```js
const clone = await git.shallowClone("microsoft/genaiscript", {
    force: true,
    install: true,
})
```

## Git dans d’autres dépôts

Utilisez `git.client` pour ouvrir un client git sur un autre répertoire de travail. Cela vous permet d’exécuter des commandes git sur un autre dépôt.

```js
const other = git.client("/path/to/other/repo")
const branch = await other.branch()
```
