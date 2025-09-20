system({
    title: "Validates content safety before uploading assets via GitHub uploadAsset",
    description: "Scans file content for secrets, harmful content, and validates file types before upload",
})

export default function (ctx: ChatGenerationContext) {
    const { defOutputProcessor, defChatParticipant } = ctx

    defOutputProcessor(async (res) => {
        // Check if there are any uploadAsset calls in the generated code
        const uploadAssetPattern = /github\.uploadAsset\s*\(/g
        if (!uploadAssetPattern.test(res.text)) {
            return // No upload operations detected
        }

        // Get content safety service if available
        const contentSafety = await host.contentSafety()
        
        // Scan for potential secrets in the generated code
        const secretPatterns = [
            /(?:api[_-]?key|apikey|access[_-]?token|secret[_-]?key|private[_-]?key|password)\s*[:=]\s*['"'][^'"]{8,}['"]/gi,
            /(?:github|gh)[_-]?(?:token|pat)\s*[:=]\s*['"'][^'"]{8,}['"]/gi,
            /(?:bearer|authorization)\s*[:=]\s*['"'][^'"]{20,}['"]/gi,
            /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
            /ghp_[A-Za-z0-9]{36}/g, // GitHub personal access tokens
            /ghs_[A-Za-z0-9]{36}/g, // GitHub server tokens
            /gho_[A-Za-z0-9]{36}/g, // GitHub OAuth tokens
            /sk-[A-Za-z0-9]{48}/g, // OpenAI API keys
            /AKIA[0-9A-Z]{16}/g, // AWS Access Key IDs
            /xox[baprs]-[0-9a-zA-Z]{10,48}/g, // Slack tokens
            /AIza[0-9A-Za-z\\-_]{35}/g, // Google API keys
        ]

        for (const pattern of secretPatterns) {
            if (pattern.test(res.text)) {
                return {
                    files: {},
                    text: "response erased: potential secret detected in upload operation",
                }
            }
        }

        // Check for harmful content if content safety is available
        if (contentSafety?.detectHarmfulContent) {
            const { harmfulContentDetected } = 
                (await contentSafety.detectHarmfulContent(res.text)) || {}
            if (harmfulContentDetected) {
                return {
                    files: {},
                    text: "response erased: harmful content detected in upload operation",
                }
            }
        }

        // Add safety warnings to the output if upload operations are detected
        const safetyWarning = `

⚠️ **Upload Safety Notice**: The generated code includes file upload operations. Please review:
- Ensure uploaded files don't contain sensitive information (API keys, tokens, passwords)
- Verify file content is appropriate and safe
- Check file types are allowed and necessary
- Consider file size implications
- Review GitHub repository permissions before uploading

`
        
        return {
            files: res.files,
            text: res.text + safetyWarning,
        }
    })

    // Also monitor chat messages for upload-related content with secrets
    defChatParticipant((ctx, messages) => {
        const assistants = messages.filter(({ role }) => role === "assistant")
        const uploadMatches = assistants.filter(({ content }) => {
            const text = typeof content === "string" ? content 
                : Array.isArray(content) ? content.map(c => c.text || "").join(" ")
                : ""
            
            // Check if contains upload operations with potential secrets
            if (/github\.uploadAsset\s*\(/g.test(text)) {
                const secretPatterns = [
                    /ghp_[A-Za-z0-9]{36}/g,
                    /ghs_[A-Za-z0-9]{36}/g, 
                    /gho_[A-Za-z0-9]{36}/g,
                    /sk-[A-Za-z0-9]{48}/g, // OpenAI API keys
                    /AKIA[0-9A-Z]{16}/g, // AWS Access Key IDs
                    /xox[baprs]-[0-9a-zA-Z]{10,48}/g, // Slack tokens
                    /AIza[0-9A-Za-z\\-_]{35}/g, // Google API keys
                ]
                return secretPatterns.some(pattern => pattern.test(text))
            }
            return false
        })
        
        if (uploadMatches.length > 0) {
            throw new Error("Upload operation with potential secret detected")
        }
    })
}