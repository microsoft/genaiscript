script({
    title: "AICI combine demo",
})

const { text: answer } = await runPrompt(
    (_) => {
        _.$`Ultimate answer is to the life, universe and 
    everything is ${AICI.gen({ regex: /\d\d/ })}`
    },
    { model: "aici:mixtral" }
)

$`What is the meaning of ${answer}?`
