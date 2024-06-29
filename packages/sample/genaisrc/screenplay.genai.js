script({
    title: "A dialog generator for descript",
    description:
        "Given a description of scenes, generate a dialog between two avatar characters.",
})

const spec = env.files.find((f) => f.filename.endsWith(".gpspec.md"))
const output = spec.filename.replace(".gpspec.md", ".dialog.md")
def(
    "INFO",
    env.files.filter((f) => f.filename.includes("info"))
)
def("TASK", spec)
def(
    "TRANSCRIPT",
    env.files.filter((f) => f.filename.endsWith(".transcript.md"))
)

$`You are a screenplay expert at writing dialogs. You are writing a dialog between two actors that play news commentators anchors. Make it a conversation
between the two anchors, similarly to sports commentators.

The subject is a screen recording of a software tool that needs to be described. The tool
is described in INFO. Use information from INFO in the dialogs.

TRANSCRIPT contains the transcript of the video as it was recorded. 
Rewrite TRANSCRIPT as a dialog. Save the dialog in a markdown format in DIALOG file ${output} formatted as follows:

\`\`\`markdown
Ethan: Text that anchor1 needs to say

Nancy: Text that anchor2 needs to say
More text to say by anchor 2

Ethan: Text that anchor1 needs to say
\`\`\`
`
