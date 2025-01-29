import { makeItBetter } from "genaiscript/runtime"
def("CODE", env.files)
$`Analyze and improve the code.`
// tell the LLM to 'make it better' 2 times
makeItBetter({ repeat: 2 })
