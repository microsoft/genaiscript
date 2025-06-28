---
title: Markdown AST
description: Use the mdast helpers to parse and manipulate Markdown documents
sidebar:
  order: 80
---

import { PackageManagers } from "starlight-package-managers";

Ces assistants d’exécution offrent une interface conviviale autour de [remark](https://github.com/remarkjs/remark), [mdast](https://github.com/syntax-tree/mdast), [unified](https://github.com/syntax-tree/unist)écosystème afin d’analyser et de manipuler des documents Markdown.

Pour bénéficier de l'autocomplétion de types, vous devrez installer le paquet `@types/mdast`\`@types/mdast\` en tant que dépendance de développement.

<PackageManagers pkg="@types/mdast" dev />

## Manipulation de Markdown

* charger les parseurs

```typescript
import { mdast } from "@genaiscript/runtime";

const { parse, visit, stringify } = await mdast();
```

* analyse vers un arbre mdast

```typescript
const root = parse("# Hello World");
```

* parcourir l’arbre (voir [documentation](https://unifiedjs.com/learn/recipe/tree-traversal/pnp))

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

Traduit à l’aide de l’IA. Veuillez vérifier le contenu pour en garantir l’exactitude.
