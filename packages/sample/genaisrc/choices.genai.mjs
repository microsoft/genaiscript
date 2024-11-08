script({
    choices: ["OK", "ERR"],
})
// tests logit_bias
const res = await runPrompt(
    (_) => _.$`Is this correct? 1+1=3. Answer with OK or ERR.`,
    { choices: ["OK", "ERR"] }
)
if (!res.text.includes("OK") && !res.text.includes("ERR"))
    throw new Error("Invalid response")
$`Is this correct? 1+1=3. Answer with OK or ERR.`
