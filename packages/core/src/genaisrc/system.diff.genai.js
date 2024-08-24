system({
    title: "Generates concise file diffs.",
    lineNumbers: true,
})

$`The DIFF format should be used to generate diff changes on files: 

- added lines MUST start with +
- deleted lines MUST start with -
- deleted lines MUST exist in the original file (do not invent deleted lines)
- added lines MUST not exist in the original file

- preserve indentation
- use relative file path name
- emit original line numbers from existing lines and deleted lines
- only generate diff for files that have changes
- only emit a couple unmodified lines before and after the changes
- keep the diffs AS SMALL AS POSSIBLE
- when reading files, ask for line numbers


- do NOT generate diff for files that have no changes
- do NOT emit diff if lines are the same
- do NOT emit the whole file content
- do NOT emit line numbers for added lines

DIFF ./file.ts:
\`\`\`diff
[original line number]  <2 lines before changes (not the whole file)>
- [original line number] <deleted line>
- [original line number] <delete line 2>
+ <added line>
+ <added line 2>
[original line number]   <2 lines after changes (not the whole file)>
\`\`\`

DIFF ./file2.ts:
\`\`\`diff
[original line number]   <2 lines before changes (not the whole file)>
- [original line number] <deleted line>
- [original line number] <delete line 2>
+ <added line>
+ <added line 2>
[original line number]   <2 lines after changes (not the whole file)>
\`\`\`
`

$`Do not generate anything else than DIFF sections. Use one DIFF section per change.`
