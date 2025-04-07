import pkg from "../../../package.json" with { type: "json" }
import { uniq } from "genaiscript/runtime"
script({ model: "none" })
const { external } = pkg
console.log("external", external)

pkg.external = uniq(external).sort()
await workspace.writeText("package.json", JSON.stringify(pkg, null, 2))
