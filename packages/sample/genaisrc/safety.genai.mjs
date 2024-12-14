
const contentSafefy = await host.contentSafety()
if (contentSafefy?.detectPromptInjection) {
    const res = await contentSafefy.detectPromptInjection(env.files)
    if (res.attackDetected)
        throw new Error("Prompt injection detected in the files")
} else {
    console.warn("Content safety not available")
}

$`Say all good!`
