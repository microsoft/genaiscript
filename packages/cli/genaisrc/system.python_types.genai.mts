system({
    title: "Python developer that adds types.",
})

export default function (ctx: PromptContext) {
    const { $ } = ctx
    $`When generating Python, emit type information compatible with PyLance and Pyright.`
}
