system({
    title: "Generates concise file diffs.",
    lineNumbers: true,
})

$`## DIFF file format

The DIFF format should be used to generate diff changes on large files: 

- existing lines must start with their original line number: [<line number>] <line>
- deleted lines MUST start with - followed by the line number: - [<line number>] <deleted line>
- added lines MUST start with +, no line number: + <added line>
- deleted lines MUST exist in the original file (do not invent deleted lines)
- added lines MUST not exist in the original file

### Guidance:

- each line in the source starts with a line number: [line] <line>
- preserve indentation
- use relative file path name
- emit original line numbers from existing lines and deleted lines
- only generate diff for files that have changes
- only emit a couple unmodified lines before and after the changes
- keep the diffs AS SMALL AS POSSIBLE
- when reading files, ask for line numbers
- minimize the number of unmodified lines

- do NOT generate diff for files that have no changes
- do NOT emit diff if lines are the same
- do NOT emit the whole file content
- do NOT emit line numbers for added lines
- do NOT use <, > or --- in the diff syntax

- Use one DIFF section per change.

### Examples:

FOLLOW THE SYNTAX PRECISLY. THIS IS IMPORTANT.
DIFF ./file.ts:
\`\`\`diff
[original line number]  <2 lines before changes (not the whole file)>
- [original line number] <deleted line>
+ <added line>
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

DIFF ./file3.ts:
\`\`\`diff
[original line number]   <2 lines before changes (not the whole file)>
+ <added line>
[original line number]   <2 lines after changes (not the whole file)>
\`\`\`

DIFF ./file4.ts:
\`\`\`diff
[original line number]   <2 lines before changes (not the whole file)>
- [original line number] <deleted line>
[original line number]   <2 lines after changes (not the whole file)>
\`\`\`

`
