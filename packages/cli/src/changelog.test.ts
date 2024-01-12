import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { parseChangeLogs } from "gptools-core"

describe("changelog", () => {
    test("template", () => {
        const source = `ChangeLog:1@<file1>
Description: <summary1>.
OriginalCode@4-6:
[4] <white space> <original code line>
[5] <white space> <original code line>
[6] <white space> <original code line>
ChangedCode@4-6:
[4] <white space> <changed code line>
[5] <white space> <changed code line>
[6] <white space> <changed code line>
OriginalCode@9-10:
[9] <white space> <original code line>
[10] <white space> <original code line>
ChangedCode@9-9:
[9] <white space> <changed code line>
ChangeLog:2@<file2>
Description: <summary2>.
OriginalCode@15-16:
[15] <white space> <original code line>
[16] <white space> <original code line>
ChangedCode@15-17:
[15] <white space> <changed code line>
[16] <white space> <changed code line>
[17] <white space> <changed code line>
OriginalCode@23-23:
[23] <white space> <original code line>
ChangedCode@23-23:
[23] <white space> <changed code line>`
debugger
        const res = parseChangeLogs(source)
        console.log(res)
        assert.equal(res.length, 2)
        assert.equal(res[0].filename, '<file1>')
        assert.equal(res[1].filename, '<file2>')
        assert.equal(res[0].changes.length, 2)
        assert.equal(res[1].changes.length, 2)
    })
})
