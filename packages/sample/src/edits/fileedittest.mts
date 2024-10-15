export function editTest() {
    def("FILE", env.files)

    $`- Implement the functions with TODO.
- Delete all comments in the entire file. This is important.
- Delete all empty lines
- process all files, do NOT skip any
`

    defOutputProcessor((output) => {
        const { fileEdits } = output
        const fns = Object.keys(fileEdits)
        if (!fns.length) throw new Error("no file edits")
        for (const [fn, fe] of Object.entries(fileEdits)) {
            const res = fe.after
            if (/^\s*(#|\/\/).*$/m.test(res)) {
                console.log(res)
                throw new Error(fn + " some comments were not removed")
            }
            if (res.includes("// BODY"))
                throw new Error(fn + " the // BODY comment was not removed")
        }
    })
}
