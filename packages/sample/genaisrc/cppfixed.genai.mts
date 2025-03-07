/**
 * Script to automatically fix C++ compilation warnings and errors.
 *
 * This script:
 * 1. Attempts to compile a C++ file with strict GCC flags (-Wall, -Wextra, -Werror, -pedantic)
 * 2. If compilation fails, it uses an AI prompt to analyze and fix the code
 * 3. Applies the suggested fixes and attempts compilation again
 * 4. Repeats until compilation succeeds or max retries (10) are reached
 * 5. Shows diffs of all changes made during the repair process
 *
 * The script outputs detailed information about each compilation attempt,
 * including compiler errors, git diffs, and the AI-suggested fixes.
 *
 * @remarks
 * Requires access to gcc compiler, git commands, and AI capabilities for code repair
 */
script({
    files: "src/cppwarnings.cpp",
})

const { files, output, vars } = env
const filenames = files.map(({ filename }) => filename)

/**
 * Count the number of errors and warnings in GCC compiler output
 * @param gccOutput - The stderr output from GCC compilation
 * @returns Object containing count of errors and warnings
 */
function countErrorsAndWarnings(gccOutput: string): {
    errors: number
    warnings: number
} {
    const errorRegex = /error:/g
    const warningRegex = /warning:/g

    const errorMatches = gccOutput.match(errorRegex)
    const warningMatches = gccOutput.match(warningRegex)

    return {
        errors: errorMatches ? errorMatches.length : 0,
        warnings: warningMatches ? warningMatches.length : 0,
    }
}

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
        { label: "gcc", ignoreError: true }
    )
    const { errors, warnings } = countErrorsAndWarnings(res.stderr)
    output.detailsFenced(`gcc output, !${warnings} x${errors}`, res.stderr)
    return { ...res, errors, warnings }
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
            if (diff)
                _.def("GIT_DIFF", diff, { language: "diff", ignoreEmpty: true })
            _.def("FILE", prev, { language: "cpp" })
            _.$`You are an expert C++ developer with the GCC compiler.
        
        You are given the output of the GCC compiler with strict flags in <GCC> and the C++ source in <FILE>.`
            if (diff)
                _.$`The diff of the repair already attempted is in <GIT_DIFF>.`
            _.$`Your task is to fix the C++ code in <FILE> to remove all warnings and errors in <GCC>.`
            _.$`- regenerate the C++ source files in <FILE> to remove all warnings and errors in <GCC>.
                - the gcc flags are 'gcc -Wall -Wextra -Werror -pedantic -o cppwarnings",'
                - do not change the filename, do not add any new files, do not remove files.
                - do not change the code style.
                - do not remove the 'main' function.                
                - do the minimum changes to fix the code found in <GCC>.`
            _.defFileOutput(filenames, "The repaired C++ source files")
        },
        {
            model: "large",
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
