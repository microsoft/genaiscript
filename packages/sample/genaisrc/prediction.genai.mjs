script({
    files: "src/greeter.ts",
    tests: {
        files: "src/greeter.ts",
    },
})

def("FILE", env.files[0], { prediction: true })

$`Add comments to every line of code. Respond only with code.`
