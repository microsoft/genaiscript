script({
    tools: [
        "fs_read_file",
        "python_code_interpreter_copy_files_to_container",
        "python_code_interpreter_read_file",
        "python_code_interpreter_run",
    ],
})
def("DATA", env.files.map(({ filename }) => filename).join("\n"))
def("QUESTION", env.vars.question)

$`Run python code to answer the data analyst question 
in QUESTION using the data in DATA.
Return the python code that was used to compute the answer.
`
