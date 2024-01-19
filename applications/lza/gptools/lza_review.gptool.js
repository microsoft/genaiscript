gptool({
    title: "LZA review",
    description: "Analyze the contents of SPEC files from a git repository of a Microsoft Azure Landing Zone Accelerator (LZA) for an enterprise software company. The user will share a file and its dependencies for you to analyze.",
    categories: ["Azure Landing Zone"],
    system: ["system", "system.explanations", "system.technical", "system.annotations"],
    model: "gpt-4"
})

// use $ to output formatted text to the prompt
$`# Context

You are a Azure Bicep language expert.
You will analyze the contents of SPEC files 
from a git repository of a Microsoft Azure Landing Zone Accelerator (LZA) 
for an enterprise software company.

## Objective

Identify security issues in SPEC files. 
Use ANNOTATIONS to highlight the issues, best practices or improvements in SPECS. 

-  Look for bad practices.
-  Look for weak secrets and passwords
-  Look for any pattern that would to a security issue.
-  Add link to documentation about security issues.
-  Do NOT generate annotations for DEPS files.
-  Do NOT generate a bullet point list. 
`

const biceps = env.links.filter(f => f.filename.endsWith(".bicep"))
def("SPECS", biceps, { lineNumbers: true })

// inline dependencies
for (const link of biceps) {
    const filename = link.filename
    const dirname = filename.split(/\//g).slice(0, -1).join("/") + "/"
    const content = link.content
    const dependencies = content.matchAll(/module\s+([^\s]+)\s+\'([^']+)'/g)
    for (const dependency of dependencies) {
        const [, , path] = dependency
        if (path.includes("shared")) continue // ignore those shared files
        const dp = dirname + path
        const resp = await fetchText(dp)
        def("DEPS", resp.file, { lineNumbers: true })
    }
}
