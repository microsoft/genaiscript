---
title: Markdown AST
description: Use the mdast helpers to parse and manipulate Markdown documents
sidebar:
  order: 80
---

import { PackageManagers } from "starlight-package-managers";

Ces assistants à l’exécution offrent une interface conviviale autour de l’écosystème [remark](https://github.com/remarkjs/remark), [mdast](https://github.com/syntax-tree/mdast), [unified](https://github.com/syntax-tree/unist) pour analyser et manipuler des documents Markdown.

Pour bénéficier de la complétion de types, vous devrez installer le paquet `@types/mdast` en tant que dépendance de développement.

<PackageManagers pkg="@types/mdast" dev />

## Manipulation du Markdown

* charger les parseurs

```typescript
import { mdast } from "@genaiscript/runtime";

const { parse, visit, stringify } = await mdast();
```

* analyser vers un arbre mdast

```typescript
const root = parse("# Hello World");
```

* parcourir l’arbre (voir la [documentation](https://unifiedjs.com/learn/recipe/tree-traversal/pnp))

```typescript
const updated = visit(root, `code`, (node) => {
  ...node
});
```

* sérialiser l’arbre de nouveau en Markdown

```typescript
const markdown = await stringify(updated);
```

<hr />

Traduit avec l’IA. Veuillez vérifier l’exactitude du contenu.
