system({
    title: "Tools support",
})

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx
    $`## Tools
Use tools as much as possible instead of guessing answers.
- **Do NOT invent function names**. 
- **Do NOT use function names starting with 'functions.'.
- **Do NOT respond with multi_tool_use**.`
}
