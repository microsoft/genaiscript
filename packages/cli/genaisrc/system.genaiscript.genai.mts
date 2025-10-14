system({
    title: "Tools to manage GenAIScript scripts compilation",
})

export default function (ctx: ChatGenerationContext) {
    const { defTool } = ctx

    defTool(
        "genaiscript_init",
        "Initialize TypeScript definitions for GenAIScript scripts. Writes TypeScript definition files in script folders to enable type checking.",
        {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description:
                        "Path to the script folder relative to the workspace root. If not provided, initializes all script folders.",
                },
            },
        },
        async (args) => {
            const { path } = args
            const cliArgs = ["scripts", "fix"]
            if (path) cliArgs.push(path)
            return await host.exec("npx", ["genaiscript", ...cliArgs], {
                cwd: path || ".",
            })
        }
    )

    defTool(
        "genaiscript_recompile",
        "Recompile GenAIScript scripts. This automatically runs initialization (init) before compiling to ensure TypeScript definitions are up to date.",
        {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description:
                        "Path to the script folder relative to the workspace root. If not provided, compiles all script folders.",
                },
            },
        },
        async (args) => {
            const { path, context } = args

            // First run init to ensure TypeScript definitions are up to date
            context.log("Initializing TypeScript definitions...")
            const initArgs = ["scripts", "fix"]
            if (path) initArgs.push(path)
            const initResult = await host.exec(
                "npx",
                ["genaiscript", ...initArgs],
                { cwd: path || "." }
            )
            if (initResult.exitCode !== 0) {
                return `Initialization failed (exit code ${initResult.exitCode}):\n${initResult.stderr || initResult.stdout}`
            }

            // Then compile
            context.log("Compiling scripts...")
            const compileArgs = ["scripts", "compile"]
            if (path) compileArgs.push(path)
            const compileResult = await host.exec(
                "npx",
                ["genaiscript", ...compileArgs],
                { cwd: path || "." }
            )

            if (compileResult.exitCode !== 0) {
                return `Compilation failed (exit code ${compileResult.exitCode}):\n${compileResult.stderr || compileResult.stdout}`
            }

            return `Successfully recompiled scripts${path ? ` in ${path}` : ""}\n${compileResult.stdout}`
        }
    )
}
