import test, { beforeEach, describe } from "node:test"
import {
    convertAnnotationsToItems,
    convertAnnotationsToMarkdown,
    eraseAnnotations,
    parseAnnotations,
} from "./annotations"
import assert from "assert/strict"

describe("annotations", () => {
    test("github", () => {
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

    test("tsc", () => {
        const output = `

src/annotations.ts:11:28 - error TS1005: ',' expected.
        `

        const diags = parseAnnotations(output)
        // console.log(diags)
        assert.strictEqual(diags.length, 1)
        assert.strictEqual(diags[0].severity, "error")
        assert.strictEqual(diags[0].filename, "src/annotations.ts")
        assert.strictEqual(diags[0].range[0][0], 10)
        assert.strictEqual(diags[0].range[1][0], 27)
        assert.strictEqual(diags[0].code, "TS1005")
        assert.strictEqual(diags[0].message, "',' expected.")
    })
})

test("convertAnnotationsToItems", () => {
    const input = `
::warning file=src/greeter.ts,line=2,endLine=2,code=missing_semicolon::Missing semicolon after property declaration.
::warning file=src/greeter.ts,line=5,endLine=5,code=missing_semicolon::Missing semicolon after assignment.
::warning file=src/greeter.ts,line=9,endLine=9,code=missing_semicolon::Missing semicolon after return statement.
::warning file=src/greeter.ts,line=18,endLine=18,code=empty_function::The function 'hello' is empty and should contain logic or be removed if not needed.
::warning file=src/greeter.ts,line=20,endLine=20,code=missing_semicolon::Missing semicolon after variable declaration.
    `
    const output = convertAnnotationsToItems(input)
    console.log(output)
    assert.strictEqual(
        output.trim(),
        `- ⚠️ Missing semicolon after property declaration. ([src/greeter.ts#L2](src/greeter.ts) missing_semicolon)
- ⚠️ Missing semicolon after assignment. ([src/greeter.ts#L5](src/greeter.ts) missing_semicolon)
- ⚠️ Missing semicolon after return statement. ([src/greeter.ts#L9](src/greeter.ts) missing_semicolon)
- ⚠️ The function 'hello' is empty and should contain logic or be removed if not needed. ([src/greeter.ts#L18](src/greeter.ts) empty_function)
- ⚠️ Missing semicolon after variable declaration. ([src/greeter.ts#L20](src/greeter.ts) missing_semicolon)`
    )
})
