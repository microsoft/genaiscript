gptool({
    title: "A dialog generator for descript",
    description:
        "Given a description of scenes, generate a dialog between two avatar characters.",
})

const output = env.file.filename.replace(".gpspec.md", ".dialog.md")
def(
    "INFO",
    env.links.filter(
        (f) => f.filename.endsWith(".md") && !f.filename.endsWith(".dialog.md")
    )
)
def("SCENES", env.file)

$`You are a screenplay expert at writing dialogs. You are writing a dialog between two actors that play news commentators anchors. Make it a conversation
between the two anchors, similarly to sports commentators.

The subject is a screen recording of a software tool that needs to be described. The tool
is described in INFO. Use information from INFO in the dialogs.

SCENES contains the description of each scene. Save the dialog in a markdown format in DIALOG file ${output} formatted as follows:

\`\`\`markdown
Ethan: Text that anchor1 needs to say

Nancy: Text that anchor2 needs to say
More text to say by anchor 2

Ethan: Text that anchor1 needs to say
\`\`\`
`
