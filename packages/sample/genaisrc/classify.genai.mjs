import { classify } from "genaiscript/runtime"

const res = await classify("The app crashes when I try to upload a file.", {
    "bug": "a software defect",
    "feat": "a feature request",
    "qa": "an inquiry about how to use the software",
})

console.log(res)
