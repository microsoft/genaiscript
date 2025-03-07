script({
    files: "src/cppwarnings.cpp",
})

const { files, output, vars } = env
const filenames = files.map(({ filename }) => filename)

const compile = async () => {
    const res = await host.exec(
        "gcc",
        [
            "-Wall",
            "-Wextra",
            "-Werror",
            "-pedantic",
            "-o",
            "cppwarnings",
            ...filenames,
        ],
        { label: "gcc" }
    )
    output.detailsFenced(`gcc output`, res.stderr)
    return res
}

let retry = 1
do {
    output.heading(2, `Attempt ${retry}`)
    const compilation = await compile()
    if (compilation.exitCode === 0) {
        output.note(`compilation success!`)
        break // success
    }
    const { stderr } = compilation

    const diff = await git.diff({
        ignoreSpaceChange: true,
        llmify: true,
        paths: filenames,
    })
    if (diff) output.detailsFenced(`git diff`, diff)

    const prev = await Promise.all(
        filenames.map((filename) => workspace.readText(filename))
    )
    const repair = await runPrompt(
        (_) => {
            _.def("GCC", stderr, { language: "gcc" })
            _.def("GIT_DIFF", diff, { language: "diff", ignoreEmpty: true })
            _.def("FILE", prev, { language: "cpp" })
            _.$`You are an expert C++ developer with the GCC compiler.
        
        You are given the output of the GCC compiler with strict flags in <GCC> and the C++ source in <FILE>.`
            if (diff)
                _.$`The diff of the repair already attempted is in <GIT_DIFF>.`
            _.$`Your task is to fix the C++ code in <FILE> to remove all warnings and errors in <GCC>.`
            _.$`- do not change the filename, do not add any new files, do not remove files.
                - do not change the code style.
                - do not remove the 'main' function.                
                - do the minimum changes to fix the code found in <GCC>.`
            _.defFileOutput(filenames, "The repaired C++ source files")
        },
        {
            systemSafety: false,
            responseType: "markdown",
            system: ["system", "system.files"],
            applyEdits: true,
        }
    )

    output.detailsFenced(`repaired`, repair.text)
    if (!Object.keys(repair.fileEdits).length) {
        output.note(`no edits made`)
        break // no edits
    }

    for (const [filename, edit] of Object.entries(repair.fileEdits)) {
        output.detailsFenced(
            filename,
            parsers.diff(
                { filename, content: edit.before || "" },
                { filename, content: edit.after || "" }
            ),
            "diff"
        )
    }

    output.appendContent("\n\n")
} while (retry++ < 10)

const final = await compile()

output.heading(3, `Final compilation`)
output.fence(final.stderr)
