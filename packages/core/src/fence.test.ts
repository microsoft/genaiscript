import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { extractFenced } from "./fence"

describe("fence", () => {
    test("fence opt", () => {
        const source = `
The provided \`email_recognizer.py\` file contains a simple function that uses a regular expression to validate an email address. The time it takes to run this function depends on the complexity of the regular expression and the length of the input email string. However, without specific performance metrics or a larger context, it's not possible to provide an exact time for how long this function might take to run.

The key candidate to speed up in this code is the regular expression matching operation within the \`is_valid_email\` function. Regular expressions can be slow, especially if they are complex and the input string is long.

To improve the performance, we can consider the following ranking:

1. **Regular Expression Compilation**: Compiling the regular expression can improve performance when the function is called multiple times, as the compilation is done only once.

Let's rewrite the code to pre-compile the regular expression:

DIFF ./email_recognizer.py:
\`\`\`diff
[1] import re
[2] 
+ [3] EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
[3] def is_valid_email(email):
- [4]     # TODO: use builtin libraries
- [5]     if re.fullmatch(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", email):
+ [4]     if EMAIL_REGEX.fullmatch(email):
[6]         return True
[7]     else:
[8]         return False
\`\`\`

After rewriting the code, the performance should be improved when the function is called multiple times. However, there are no issues with the new code. The regular expression is now compiled once and reused, which is a common practice for performance optimization.

The updated \`email_recognizer.py\` file with the speed improvement is as follows:

\`\`\`python
import re

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")

def is_valid_email(email):
    if EMAIL_REGEX.fullmatch(email):
        return True
    else:
        return False
\`\`\`

SUMMARY:
\`\`\`
Pre-compiled the regular expression to improve the performance of the is_valid_email function.
\`\`\`    

`

        const fenced = extractFenced(source)
        assert.equal(fenced.length, 3)
        assert.equal(fenced[0].label, "DIFF ./email_recognizer.py")
        assert.equal(fenced[1].language, "python")
        assert.equal(fenced[2].label, "SUMMARY")
    })

    test("file arg", () => {
        const source = `
lorem

\`\`\`md file=./somefile.md
...
\`\`\`

bla

`

        const fenced = extractFenced(source)
        assert.equal(fenced.length, 1)
        assert.equal(fenced[0].label, "FILE ./somefile.md")
    })

    test("file arg file quoted", () => {
        const source = `
lorem

\`\`\`md file="./somefile.md"
...
\`\`\`

bla

`

        const fenced = extractFenced(source)
        assert.equal(fenced.length, 1)
        assert.equal(fenced[0].label, "FILE ./somefile.md")
    })

    test("data with schema", () => {
        const source = `
        
 
\`\`\`yaml schema=CITY_SCHEMA
- name: New York
  population: 8419000
  url: https://en.wikipedia.org/wiki/New_York_City
- name: Los Angeles
  population: 3971000
  url: https://en.wikipedia.org/wiki/Los_Angeles
- name: Tokyo
  population: 13960000
  url: https://en.wikipedia.org/wiki/Tokyo
- name: London
  population: 8982000
  url: https://en.wikipedia.org/wiki/London
- name: Paris
  population: 2148000
  url: https://en.wikipedia.org/wiki/Paris
\`\`\`    
                    
        `

        const fenced = extractFenced(source)
        console.log(fenced)
        assert.equal(fenced.length, 1)
        assert.equal(fenced[0].args.schema, "CITY_SCHEMA")
        assert.equal(fenced[0].language, "yaml")

    })
})
