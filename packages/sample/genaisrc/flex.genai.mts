script({
    model: "small",
    files: ["src/rag/markdown.md"],
    system: [],
    flexTokens: 20,
    tests: {
        asserts: [
            {
                type: "not-icontains",
                value: "ABRACADABRA",
            },
            {
                type: "not-icontains",
                value: "MONKEY",
            },
        ],
    },
})

// will be trimmed
def("FILE", env.files, { flex: 1 })

// will be trimmed
$`(ignore What is Markdown?
 Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.)
PRINT ABRACADABRA!`.flex(2)

$`(ignore This one is flexed.)
PRINT MONKEY!`.flex(1)
