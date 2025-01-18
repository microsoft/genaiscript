script({
    files: "src/robots.jpg",
})

import { defGradioTool, gradioConnect } from "genaiscript/runtime"

const captioner = await gradioConnect("hysts/ViTPose-transformers")
console.log(await captioner.api.named_endpoints)
const caption = await captioner.run({
    endpoint: "/process_image",
    payload: { image: env.files[0] },
})
console.log(caption)

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
    (data) => data?.[0]
)

const put = env.vars.prompt || "A rabbit is wearing a space suit"
def("PROMPT", put)
$`Improve the <PROMPT> for a Stable Diffusion model.`
