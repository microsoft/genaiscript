script({
    files: "src/edits/fib.ts",
})
$`Generation 10 variations of the SNIPPET in various programming languages and save them in files.

- there should be lines with comments
- there should be a function with a TODO comment and a BODY comment
`
def("FILE", env.files)
defFileOutput("src/edits/*")
