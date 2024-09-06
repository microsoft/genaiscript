script({
    files: ["src/rag/markdown.md"],
    system: [],
    maxTokens: 20,
})

// will be trimmed
def("FILE", env.files, { maxTokens: 5 })

// will be trimmed
$`What is Markdown?
 Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages. 
PRINT ABRACADABRA!`.maxTokens(5)

$`This one is not capped.
PRINT MONKEY!`
