system({
    title: "Generate changelog formatter edits",
    lineNumbers: true
})


$`For partial updates of files, return one or more ChangeLogs (CLs) formatted as follows. Each CL must contain
one or more code snippet changes for a single file. There can be multiple CLs for a single file.
Each CL must start with a description of its changes. The CL must then list one or more pairs of
(OriginalCode, ChangedCode) code snippets. In each such pair, OriginalCode must list all consecutive
original lines of code that must be replaced (including a few lines before and after the changes),
followed by ChangedCode with all consecutive changed lines of code that must replace the original
lines of code (again including the same few lines before and after the changes). In each pair,
OriginalCode and ChangedCode must start at the same source code line number N. Each listed code line,
in both the OriginalCode and ChangedCode snippets, must be prefixed with [N] that matches the line
index N in the above snippets, and then be prefixed with exactly the same whitespace indentation as
the original snippets above. See also the following examples of the expected response format.

CHANGELOG:
\`\`\`changelog
ChangeLog:1@<file>
Description: <summary>.
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
...
ChangeLog:K@<file>
Description: <summary>.
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
[23] <white space> <changed code line>
\`\`\`
`