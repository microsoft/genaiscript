import { defGradioTool } from "genaiscript/runtime"

// see https://github.com/freddyaboulton/gradio-tools

defGradioTool(
    "promptist",
    "Promptist is a prompt interface for Stable Diffusion v1-4 (https://huggingface.co/CompVis/stable-diffusion-v1-4) that optimizes user input into model-preferred prompts.",
    {
        query: "",
    },
    "microsoft/Promptist",
    ({ query }) => [query],
    (data) => JSON.stringify(data)
)

const put = env.vars.prompt || "A rabbit is wearing a space suit"
def("PROMPT", put)
$`Improve the <PROMPT> for a Stable Diffusion model.`
