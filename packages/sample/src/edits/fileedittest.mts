export function editTest() {
    def("FILE", env.files)

    $`- Implement the functions with TODO.
- Remove all comments.
`

    defOutputProcessor((output) => {
        const { fileEdits } = output
        //console.log(YAML.stringify(fileEdits))
        const res = fileEdits[Object.keys(fileEdits)[0]].after
        if (/^\s*\/\/.*$/.test(res))
            throw new Error("some comments were not removed")
        if (res.includes("// BODY"))
            throw new Error("the // BODY comment was not removed")
    })
}
