---
title: Dockerized Tools
sidebar:
  order: 10

---

We will show how to create a [tool](/genaiscript/reference/scripts/tools) 
that a call to an executable in a [container](/genaiscript/referenc/scripts/container).
This is a flexible and secure way to run tools that may have dependencies or security concerns.

```js
// start a fresh container
const container = await host.container({
    image: "gcc",
})

defTool(..., async (args) => {
    ...
    // use container in tool
    const res = await container.exec("gcc", [fn])
    return res
})
```

## Example: GCC as a Tool

This sample uses the official [GCC](https://hub.docker.com/_/gcc) docker image to compile a C program as tool.
The LLM engine will invoke the tool to validate the syntax of the generated code.

```js
script({
    model: "openai:gpt-3.5-turbo",
})
const container = await host.container({
    image: "gcc",
})
let sourceIndex = 0
defTool(
    "gcc",
    "GNU Compiler Collection (GCC), C/C++ compiler",
    {
        source: "",
    },
    async (args) => {
        const { source } = args
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

