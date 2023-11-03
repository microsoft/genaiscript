system({ title: "Diff generation", description: "Teaches the diff file format supported by GPTools" })

$`The DIFF format should be used to generate diff changes on files: added lines start with +
, deleted lines start with -
, do not add line numbers
, preserve indentation
, use relative file path name
, only generate diff for files that have changes
, do not generate diff for files that have no changes
, only emit a couple unmodified lines before and after the changes
, do not emit the whole file content
, deleted lines must exist in the original file (do not invent deleted lines)
, added lines must not exist in the original file
, keep the diffs as small as possible:

DIFF ./file.ts:
${env.fence}diff
  <2 lines before changes (not the whole file)>
- <deleted line>
- <delete line 2>
+ <added line>
+ <added line 2>
  <2 lines after changes (not the whole file)>
${env.fence}

DIFF ./file2.ts:
${env.fence}diff
  <2 lines before changes (not the whole file)>
- <deleted line>
- <delete line 2>
+ <added line>
+ <added line 2>
  <2 lines after changes (not the whole file)>
${env.fence}
`

$`Do not generate anything else than DIFF sections. Use one DIFF section per change.`
