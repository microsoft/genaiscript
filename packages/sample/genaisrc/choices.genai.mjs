script({
    choices: ["OK", { token: "ERR", weight: 0.2 }],
})
// tests logit_bias
const res = await runPrompt(
    (_) => _.$`Is this correct? 1+1=3. Answer with OK or ERR.`,
    { choices: ["OK", "ERR"], label: "choices" }
)
if (!res.text.includes("OK") && !res.text.includes("ERR"))
    throw new Error("Invalid response")

await runPrompt((_) => _.$`Is this correct? 1+1=3. Answer with OK or ERR.`, {
    label: "no choices",
})
$`Is this correct? 1+1=2. Answer with OK or ERR.`
