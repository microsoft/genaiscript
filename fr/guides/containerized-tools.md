Ce guide montre comment créer un [outil](../../reference/scripts/tools/) qui appelle un exécutable dans un [conteneur](../../reference/scripts/container/). C'est une méthode flexible et sécurisée pour exécuter des outils qui peuvent avoir des dépendances ou des préoccupations de sécurité.

Cela se fait généralement en créant un conteneur avec une image particulière (ici `gcc`).

```js
// start a fresh container
const container = await host.container({
    image: "gcc",
})
```

puis en réutilisant le conteneur dans les invocations de l'outil. Vous pouvez retourner le résultat de `container.exec` à partir de l'outil et il sera géré par le runtime.

```js
defTool(..., async (args) => {
    ...
    // use container in tool
    const res = await container.exec("gcc", ["main.c"])
    return res
})
```

## Exemple : GCC en tant qu'outil

Cet exemple utilise l'image officielle de docker [GCC](https://hub.docker.com/_/gcc) pour compiler un programme en C en tant qu'outil. Le moteur LLM invoquera l'outil pour valider la syntaxe du code généré.

```js
script({
    model: "large",
})
let container = undefined
let sourceIndex = 0
defTool(
    "gcc",
    "GNU Compiler Collection (GCC), C/C++ compiler",
    {
        source: "",
    },
    async (args) => {
        const { source } = args

        if (!container) // lazy allocation of container
            container = await host.container({
                image: "gcc",
            })

        const fn = `tmp/${sourceIndex++}/main.c`
        await container.writeText(fn, source)
        const res = await container.exec("gcc", [fn])
        return res
    }
)

$`Generate a valid C program that prints "Hello, World!"`
```

<details>
  <summary>👤 utilisateur</summary>

  ```markdown wrap
  Generate a valid C program that prints "Hello, World!"
  ```
</details>

<details open>
  <summary>🤖 assistant </summary>

  <details>
    <summary>📠 appel d'outil <code>gcc</code> (<code>call\_IH693jAqZaC7i3AkUa3eIFXi</code>)</summary>

    ```yaml wrap
    source: |-
        #include <stdio.h>

        int main() {
            printf("Hello, World!\n");
            return 0;
        }
    ```
  </details>
</details>

<details>
  <summary>🛠️ sortie de l'outil <code>call\_IH693jAqZaC7i3AkUa3eIFXi</code></summary>

  ```json wrap
  exitCode: 0
  stdout: ""
  stderr: ""
  failed: false
  ```
</details>

<details open>
  <summary>🤖 assistant </summary>

  ````markdown wrap
  File ./file1.c:

  ```c
  #include <stdio.h>

  int main() {
      printf("Hello, World!\n");
      return 0;
  }
  ```
  ````
</details>