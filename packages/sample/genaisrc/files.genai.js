script({
    model: "gpt-3.5-turbo",
    system: ["system", "system.files"],
    tests: {}
})

$`Generate a poem and save it in a file "poem.txt".`