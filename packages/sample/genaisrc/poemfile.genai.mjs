script({
    tests: {}
})
console.log({ runDir: env.runDir })
$`Generate a 1 sentence poem and save it to a text file.`
defFileOutput("poem.txt", "the generated poem")
