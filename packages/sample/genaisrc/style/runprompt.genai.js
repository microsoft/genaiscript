script({
    model: "openai:gpt-3.5-turbo",
    tests: {},
})

const r = await prompt`write a haiku poem`
if (r.error) throw r.error
const r2 = await runPrompt(`write a haiku poem`)
if (r2.error) throw r2.error
const r3 = await runPrompt(() => `write a haiku poem`)
if (r3.error) throw r3.error

const resPoem = await runPrompt(
    (_) => {
        _.$`write haiku poem`
    },
    {
        model: "openai:gpt-3.5-turbo",
        label: "generate poem",
        system: ["system"],
    }
)
if (resPoem.error) throw resPoem.error

const resJSON = await runPrompt(
    (_) => {
        _.$`generate 3 random numbers between 1 and 10 and respond in JSON`
    },
    {
        model: "openai:gpt-3.5-turbo",
        label: "generate json",
        responseType: "json_object",
    }
)
if (resJSON.error) throw resJSON.error

$`Is this poetry? Respond yes or no.`
fence(resPoem.text)

$`Is this JSON? Respond yes or no.`
fence(resJSON.text)
