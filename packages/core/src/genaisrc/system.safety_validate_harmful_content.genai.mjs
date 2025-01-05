system({
    title: "Uses the content safety provider to validate the LLM output for harmful content",
})

export default function main(ctx) {
    ctx.defOutputProcessor(async (res) => {
        const contentSafety = await host.contentSafety()
        const { harmfulContentDetected } =
            (await contentSafety?.detectHarmfulContent?.(res.text)) || {}
        if (harmfulContentDetected) {
            return {
                files: {},
                text: "response erased: harmful content detected",
            }
        }
    })
}
