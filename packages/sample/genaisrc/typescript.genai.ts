script({
    title: "TypeScript script",
    model: "ollama:phi3",
    tests: {}
})

function write(s: string) {
    console.log(s)    
}

write(`this is typescript`)
$`Write a poem`