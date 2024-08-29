---
title: Unlock the Potential of GenAIScript with Containerized Tools
date: 2024-08-26
authors: genaiscript
draft: true
tags:
  - GenAIScript
  - Containerization
  - GCC
  - Secure Execution
  - Tool Integration

---

In today's fast-paced development environment, ensuring the security and portability of your scripts is paramount. By leveraging containerized tools within GenAIScript, you can create isolated, secure, and portable execution environments. In this blog post, we'll walk you through the process of writing a GenAIScript that utilizes a containerized GCC compiler to compile and run a simple C program. 

## Breaking Down the Code 🛠️

Here's the complete script we'll be working with:

```javascript
script({
    model: "openai:gpt-3.5-turbo",
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

### Line-by-Line Explanation 📃

1. **Initialize the Script**:
    ```javascript
    script({
        model: "openai:gpt-3.5-turbo",
    })
    ```
    This line initializes the GenAIScript with the specified model, in this case, `openai:gpt-3.5-turbo`.

2. **Variable Declarations**:
    ```javascript
    let container = undefined
    let sourceIndex = 0
    ```
    Here, we declare two variables. `container` is used to store the container instance, initially set to `undefined`. `sourceIndex` is a counter to keep track of the source file names.

3. **Define the GCC Tool**:
    ```javascript
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
    ```
    This block defines a new tool called `gcc` using the `defTool` function. The tool description specifies that it uses the GNU Compiler Collection (GCC) for C/C++ compilation. 

    - If the container is not already initialized, it lazily allocates a new container instance with the `gcc` image.
    - Each source file is written to the container with a unique filename using the `sourceIndex` counter.
    - The container executes the GCC compiler on the source file, and the result is returned.

4. **Generate a C Program**:
    ```javascript
    $`Generate a valid C program that prints "Hello, World!"`
    ```
    This line prompts the AI model to generate a simple C program that prints "Hello, World!".

## Putting It All Together 🔧

When executed, this script will use the GenAIScript model to generate a valid C program, write it to a containerized environment, and then use GCC within the container to compile and run the program. This approach ensures that the execution environment is both secure and portable, as the container encapsulates all dependencies and execution context.

By leveraging containerized tools in your GenAIScript workflows, you can enhance the security and portability of your scripts, making your development process more robust and versatile.

Happy scripting! 🚀