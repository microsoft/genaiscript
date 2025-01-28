script({
    files: "src/fib.ts",
    model: "small",
    tests: {
        files: "src/fib.ts",
    },
})
def("CODE", env.files)
$`Analyze and improve the code.`
defChatParticipant((ctx, messages) => {
    if (messages.length < 6)
        ctx.$`Make it better. 
        If you cannot make it better, 
        respond with DONE and the final version of the code.`
})
