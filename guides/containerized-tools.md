
This guide shows how to create a [tool](/genaiscript/reference/scripts/tools)
that call an executable in a [container](/genaiscript/reference/scripts/container).
This is a flexible and secure way to run tools that may have dependencies or security concerns.

This is typically done by creating a container with a particular image (`gcc` here)

```js
// start a fresh container
const container = await host.container({
    image: "gcc",
})
```

then reusing the container in the tool invocations. You can return the result of `container.exec`
from the tool and it will be handled by the runtime.

```js
defTool(..., async (args) => {
    ...
    // use container in tool
    const res = await container.exec("gcc", ["main.c"])
    return res
})
```

## Example: GCC as a Tool

This sample uses the official [GCC](https://hub.docker.com/_/gcc) docker image to compile a C program as tool.
The LLM engine will invoke the tool to validate the syntax of the generated code.

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

<!-- genaiscript output start -->

<details>
<summary>👤 user</summary>

```markdown wrap
Generate a valid C program that prints "Hello, World!"
```

</details>

<details open>
<summary>🤖 assistant </summary>

<details>
<summary>📠 tool call <code>gcc</code> (<code>call_IH693jAqZaC7i3AkUa3eIFXi</code>)</summary>

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
<summary>🛠️ tool output <code>call_IH693jAqZaC7i3AkUa3eIFXi</code></summary>

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

<!-- genaiscript output end -->
