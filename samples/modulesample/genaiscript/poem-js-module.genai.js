import { parse } from "ini"
script({ model: "echo" })
const v = parse(`A = B`)
$`write a short poem about ${v}`
