script({
    title: "AICI combine demo",
})

const { text: answer } = await runPrompt(
    (_) => {
        _.$`Ultimate answer is to the life, universe and 
    everything is ${AICI.gen({ regex: /\d\d/ })}`
    },
    { model: "mixtral", aici: true }
)

$`What is the meaning of ${answer}?`
