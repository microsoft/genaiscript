script({
    //  model: "openai:gpt-3.5-turbo",
    responseType: "json_object",
    responseSchema: { characters: [{ name: "neo", age: 30 }] },
    tests: {},
})
$`Generate a characters.`
