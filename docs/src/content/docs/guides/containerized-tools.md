---
title: Containerized Tools
sidebar:
  order: 10
description: Learn how to create and use containerized tools with executable
  dependencies in a secure environment using GCC as an example.
keywords: containerization, docker, GCC, tool integration, secure execution
llmstxt:
  content: >-
    This guide explains how to create a tool that runs an executable inside a
    container, ensuring flexibility and security for tools with dependencies or
    security concerns. The example uses the GCC Docker image to compile a C
    program.


    To start, initialize a container with the desired image (e.g., `gcc`):


    const container = await host.container({ image: "gcc" });


    Reuse this container in tool invocations. Use `container.exec` to execute
    commands within the container:


    defTool(..., async (args) => {
        const res = await container.exec("gcc", ["main.c"]);
        return res;
    });


    Example: Define a GCC tool to compile and validate C code. The tool lazily
    initializes the container, writes the source code to a temporary file, and
    invokes GCC:


    let container = undefined;

    let sourceIndex = 0;


    defTool("gcc", "GNU Compiler Collection (GCC), C/C++ compiler", { source: ""
    }, async (args) => {
        const { source } = args;
        if (!container) container = await host.container({ image: "gcc" });
        const fn = `tmp/${sourceIndex++}/main.c`;
        await container.writeText(fn, source);
        const res = await container.exec("gcc", [fn]);
        return res;
    });


    Example input: Generate a valid C program that prints "Hello, World!". The
    tool compiles the following code successfully:


    #include <stdio.h>

    int main() {
        printf("Hello, World!\n");
        return 0;
    }
  hash: 91f53641063d1be3516288724618198fe3fcd2c9b041ed44e3ba9c85371c48f8

---

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
