/**
 *
 * @param task
 * @param result
 * @param categories
 * @param options
 * @returns
 */
async function judgeClassify(
    task: Awaitable<string>,
    result: Awaitable<string>,
    categories: Record<string, string>,
    options?: {
        logprobs?: boolean
        topLogprobs?: number
        model?: ModelType
        temperature?: number
    }
) {
    const unknown = "unknown"
    const unknownText =
        "if you do not have enough information or certainty to categorize the result"

    const choices = { ...categories, ...{ [unknown]: unknownText } }
    const res = await runPrompt(
        async (ctx) => {
            ctx.$`## Task
        You will be given a task description in <TASK> and a response from a chat bot in <RESULT>. 
        Your task is to judge and classify <RESULT> according to the categories in <CATEGORY>.

        - Rely exclusively on the information provided in the task and the response.
        
        ## Output
        The output should start with the step-by-step explanation of the classification (one paragraph).
        Finish the output with the category name on a single line, no other words.
        `.role("system")
            ctx.def("TASK", await task)
            ctx.def("RESULT", await result)
            ctx.def(
                "CATEGORY",
                Object.entries(choices)
                    .map((kv) => `- ${kv[0]}: ${kv[1]}`)
                    .join("\n")
            )
        },
        {
            system: ["system.output_plaintext", "system.safety_jailbreak"],
            choices: Object.keys(choices),
            logprobs: options?.logprobs,
            topLogprobs: options?.topLogprobs,
            temperature: options?.temperature || 0.1,
            model: options?.model || "small",
        }
    )

    // extract the classifiction
    const category = Object.keys(choices)
        .map((category) => ({
            category,
            l: res.text.lastIndexOf(category),
        }))
        .filter(({ l }) => l > -1)
        .sort((a, b) => a.l - b.l)[0]?.category

    const logprob = res.logprobs?.reverse().find((lp) => lp.token === category)
    return {
        category,
        logprob,
    }
}

const task = "Generate a funny joke."
//const { text: result } = await runPrompt(task)
let result = "Why did the tomato turn red? Because boo."

const res = await judgeClassify(task, result, {
    pass: "the joke was funny",
    fail: "the joke was not funny",
})
console.log(res)
