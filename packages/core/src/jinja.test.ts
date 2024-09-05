import { jinjaRender } from "./jinja"
import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"

describe("jinjaRender", () => {
    test("should correctly render template with values", () => {
        // Given a template and values
        const template = "Hello, {{ name }}! Today is {{ day }}."
        const values = { name: "Alice", day: "Monday" }

        // When rendering the template
        const result = jinjaRender(template, values)

        // Then the result should be as expected
        const expected = "Hello, Alice! Today is Monday."
        assert.strictEqual(result, expected)
    })
})
