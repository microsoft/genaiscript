system({ title: "Diff generation", description: "Teaches the diff file format supported by GPTools" })

$`The DIFF format should be used to generate diff changes on files: added lines start with +
, deleted lines start with -
, do not add line numbers
, preserve indentation
, use relative file path name
, only generate diff for files that have changes
, do NOT generate diff for files that have no changes
, only emit a couple unmodified lines before and after the changes
, do NOT emit the whole file content
, deleted lines MUST exist in the original file (do not invent deleted lines)
, added lines MUST not exist in the original file
, emit line numbers
, keep the diffs as small as possible:

DIFF ./file.ts:
${env.fence}diff
[line number]  <2 lines before changes (not the whole file)>
[line number] - <deleted line>
[line number] - <delete line 2>
[line number] + <added line>
[line number] + <added line 2>
[line number]   <2 lines after changes (not the whole file)>
${env.fence}

DIFF ./file2.ts:
${env.fence}diff
[line number]   <2 lines before changes (not the whole file)>
[line number] - <deleted line>
[line number] - <delete line 2>
[line number] + <added line>
[line number] + <added line 2>
[line number]   <2 lines after changes (not the whole file)>
${env.fence}
`

$`Do not generate anything else than DIFF sections. Use one DIFF section per change.`
