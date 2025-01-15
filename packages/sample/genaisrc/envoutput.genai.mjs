const { output } = env

output.heading(3, "hello world")

$`Write a poem`

output.fence(`let x = "abc"`, "js")
output.itemValue("item", "value")
output.fence("This is a fence")
output.fence(
    [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
    ],
    "md"
)
output.fence(
    [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
    ],
    "csv"
)
output.fence(`A --> B`, "mermaid")
output.fence(`A -> B`, "mermaid")
output.fence(
    `
sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!
    Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.

    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?

    `,
    "mermaid"
)
