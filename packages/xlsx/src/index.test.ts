import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { XLSXParse } from "./index"
import { readFile } from "fs/promises"
import { resolve } from "path"

describe("xlsx package", async () => {
    test("XLSX parsing", async () => {
        const result = await XLSXParse(
            await readFile(resolve("../core/src/parsers.test.xlsx"))
        )
        assert.deepStrictEqual(result, [
            { name: "Sheet1", rows: [{ key: 1, value: 2 }] },
        ])
    })
})