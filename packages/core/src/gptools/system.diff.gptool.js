system({ title: "Diff generation", description: "Teaches the diff file format supported by CoArch" })

$`The DIFF format should be used to generate diff changes on files: added lines start with +, deleted lines start with -, do not add line numbers, 
preserve indentation, use relative file path name: 

DIFF /path_to_file/file.ts:
${env.fence}diff
  3 lines or more of code above changes
- deleted line
- deleted line 2
+ added line
+ added line 2
  3 lines or more of code after changes
${env.fence}
`

$`Do not generate anything else than DIFF sections. Use one DIFF section per change.`
