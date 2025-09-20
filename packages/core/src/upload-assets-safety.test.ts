import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { TestHost } from "./testhost"
import { runPrompt } from "./runner"

describe("Upload Assets Safety", async () => {
    beforeEach(() => {
        TestHost.install()
    })

    await test("detects upload operations", async () => {
        const { text } = await runPrompt(
            `Generate code that uploads a file using github.uploadAsset(buffer)`,
            {
                system: ["system.safety_upload_assets"],
                model: "test"
            }
        )
        
        // Should contain safety warning
        assert(text.includes("Upload Safety Notice"))
        assert(text.includes("ensure uploaded files don't contain sensitive information"))
    })

    await test("detects secrets in upload code", async () => {
        const { text } = await runPrompt(
            `
            const apiKey = "sk-1234567890abcdef"
            const buffer = Buffer.from("test content")
            const url = await github.uploadAsset(buffer)
            `,
            {
                system: ["system.safety_upload_assets"],
                model: "test"
            }
        )
        
        // Should detect secret and erase response
        assert(text === "response erased: potential secret detected in upload operation")
    })

    await test("allows safe upload operations", async () => {
        const { text } = await runPrompt(
            `
            const buffer = Buffer.from("Hello world")
            const url = await github.uploadAsset(buffer)
            console.log("Uploaded to:", url)
            `,
            {
                system: ["system.safety_upload_assets"],
                model: "test"
            }
        )
        
        // Should allow the code but add safety warning
        assert(text.includes("github.uploadAsset(buffer)"))
        assert(text.includes("Upload Safety Notice"))
    })

    await test("ignores non-upload operations", async () => {
        const { text } = await runPrompt(
            `console.log("No upload operations here")`,
            {
                system: ["system.safety_upload_assets"],
                model: "test"
            }
        )
        
        // Should not add safety warning for non-upload code
        assert(!text.includes("Upload Safety Notice"))
    })
})