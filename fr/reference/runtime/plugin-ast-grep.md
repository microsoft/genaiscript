import { PackageManagers } from "starlight-package-managers";

Ces helpers d'exécution fournissent une interface conviviale autour de [ast-grep](https://ast-grep.github.io/).

## Installation

<PackageManagers pkg="@genaiscript/plugin-ast-grep" dev />

Si vous utilisez le plugin dans un environnement Node.JS, sans fichier d'entrée `.genai...`, vous devrez initialiser le [runtime](../../../reference/reference/runtime/) avant d'utiliser le plugin :

```ts
import { initialize } from "@genaiscript/runtime";

await initialize();
```

## Utilisation

Consultez le script [ast-grep](../../../reference/reference/scripts/ast-grep/) pour des exemples d'utilisation du plugin.