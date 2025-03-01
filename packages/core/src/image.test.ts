import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { renderImageToTerminal } from "./image"
import { resolveBufferLike } from "./bufferlike"
import { TestHost } from "./testhost"

describe("renderImageToConsole", () => {
    const url = "../sample/src/robots.jpg"

    beforeEach(() => {
        TestHost.install()
    })

    test("renders image to console with maxWidth", async () => {
        const maxWidth = 16
        const buffer = await resolveBufferLike(url)
        const result = await renderImageToTerminal(buffer, maxWidth)
        process.stderr.write(result)
        assert(result.includes("\n"), "Rendered image should contain new lines")
    })
})
