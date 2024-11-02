import * as ini from "ini"

script({
    files: "src/data.ini",
    tests: {},
    model: "small",
})

const src = env.files[0].content
const i = INI.parse(src)
const m = ini.parse(src)
const k = parsers.INI(src)

if (JSON.stringify(i) !== JSON.stringify(m)) throw new Error("ini error 1")
if (JSON.stringify(i) !== JSON.stringify(k)) throw new Error("ini error 2")

defData("ini", i)
$`Describe the data in INI.`
