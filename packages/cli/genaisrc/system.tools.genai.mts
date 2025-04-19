system({
    title: "Tools support",
})

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    $`## Tools
Use tools if possible. 
- **Do NOT invent function names**. 
- **Do NOT use function names starting with 'functions.'.
- **Do NOT respond with multi_tool_use**.`
}
