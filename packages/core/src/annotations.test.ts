import test, { beforeEach, describe } from "node:test"
import { parseAnnotations } from "./annotations"
import assert from "assert/strict"

describe("annotations", () => {
    test("error", () => {
        const output = `
::error file=packages/core/src/github.ts,line=71,endLine=71,code=concatenation_override::The change on line 71 may lead to the original \`text\` content being overridden instead of appending the footer. Consider using \`text = appendGeneratedComment(script, info, text)\` to ensure the original text is preserved and the footer is appended. 😇

::error file=packages/core/src/github.ts,line=161,endLine=161,code=concatenation_override::Similarly to the change on line 71, the change on line 161 could override the original \`body\` content. It's safer to use \`body = appendGeneratedComment(script, info, body)\` to append the footer while keeping the existing content intact. 🤔

::error file=packages/core/src/github.ts,line=140,endLine=141,code=unused_code::The removal of the footer in the \`appendGeneratedComment\` function on lines 140-141 results in unused code. Since \`generatedByFooter\` is now being used to append the footer, the original lines that added the footer in \`appendGeneratedComment\` should be removed to clean up the code. 🧹        
        `

        const diags = parseAnnotations(output)
       // console.log(diags)
        assert.strictEqual(diags.length, 3)
        assert.strictEqual(diags[0].severity, "error")
        assert.strictEqual(diags[0].filename, "packages/core/src/github.ts")
        assert.strictEqual(diags[0].range[0][0], 70)
        assert.strictEqual(diags[0].range[1][0], 70)
        assert.strictEqual(diags[0].code, "concatenation_override")
        assert.strictEqual(
            diags[0].message,
            "The change on line 71 may lead to the original `text` content being overridden instead of appending the footer. Consider using `text = appendGeneratedComment(script, info, text)` to ensure the original text is preserved and the footer is appended. 😇"
        )
    })
})
