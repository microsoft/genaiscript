script({
    title: "style-tester",
    system: [
        "system",
        "system.annotations",
        "system.tools",
        "system.fs_read_file",
    ],
})
const slides = def("SLIDES", env.files, { endsWith: ".md" })
$`You are an expert at creating Techinal presentation using markdown/MDX
usig the https://sli.dev/ format.

Review the content of ${slides} for clarity, consistency, and conciseness. 
Use annotations to report any issues or suggestions.

- Do NOT report issues about the markdown/MDX syntax.
- Focus on the content itself, not the formatting.
- IGNORE the frontmatter section.

The slide format can reference other files as follows. Also analyze those files.

\`\`\`md
---
src: path/to/slide.md
---
`
