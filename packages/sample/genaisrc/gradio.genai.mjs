script({
    files: "src/robots.jpg",
})

import { defGradioTool, gradioConnect } from "genaiscript/runtime"
const put = env.vars.prompt || "A rabbit is wearing a space suit"

/*try {
    const app = await gradioConnect("microsoft/Promptist")
    const predictions = await app.predict({
        payload: [put],
    })
    const newPrompt = predictions[0]
    console.log({ newPrompt })
} catch (e) {
    console.error(e)
}*/

try {
    const app = await gradioConnect("pharmapsychotic/CLIP-Interrogator")
    console.log(app.api)
    const predictions = await app.predict({
        endpoint: 0,
        payload: [env.files[0]],
    })
    console.log({ predictions })
} catch (e) {
    console.log(e)
}

// see https://github.com/freddyaboulton/gradio-tools
defGradioTool(
    "promptist",
    "Promptist is a prompt interface for Stable Diffusion v1-4 (https://huggingface.co/CompVis/stable-diffusion-v1-4) that optimizes user input into model-preferred prompts.",
    {
        query: "",
    },
    "microsoft/Promptist",
    ({ query }, info) => {
        //console.debug(info)
        return [query]
    },
    (data) => {
        console.log(data)
        return data?.[0]
    }
)

def("PROMPT", put)
$`Improve the <PROMPT> for a Stable Diffusion model.`
