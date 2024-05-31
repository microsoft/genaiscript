script({
    model: "openai:gpt-3.5-turbo",
    tests: {
        keywords: "genaiscript",
    },
})

/**
 * @type {any}
 */
const res = await fetch(
    "https://raw.githubusercontent.com/microsoft/genaiscript/main/package.json",
    { method: "GET" }
)
const pkg = await res.json()

def("PACKAGE", YAML.stringify(pkg))

$`Explain the purpose of the product described in PACKAGE. Mention its name.`
