script({
    tests: {
        keywords: "genaiscript-workspace",
    },
})

const res = await fetch(
    "https://raw.githubusercontent.com/microsoft/genaiscript/main/package.json",
    { method: "GET" }
)
const pkg = await res.json()

def("PACKAGE", YAML.stringify(pkg))

$`Explain the purpose of the product described in PACKAGE.`
