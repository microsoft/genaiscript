script({
    system: [],
})

async function bespokeMinicheck(document, claim) {
    const res = await runPrompt(
        (ctx) => {
            ctx.$`Document:
${document}
Claim:
${claim}
`
        },
        {
            model: "ollama:bespoke-minicheck",
            temperature: 0,
            system: [],
        }
    )
    if (res.error) throw res.error
    return res.text?.includes("Yes")
}

const ungrounded = await bespokeMinicheck(
    `## Phone and video call support 
GitLab does not offer support via inbound or on-demand calls.

GitLab Support Engineers communicate with you about your tickets primarily through updates in the tickets themselves. At times it may be useful and important to conduct a call, video call, or screensharing session with you to improve the progress of a ticket. The support engineer may suggest a call for that reason. You may also request a call if you feel one is needed. Either way, the decision to conduct a call always rests with the support engineer, who will determine:

* whether a call is necessary; and
* whether we have sufficient information for a successful call.
`,
    "GitLab offers support for in-bound phone calls."
)
console.log({ ungrounded })

const grounded = await bespokeMinicheck(
    `## Phone and video call support 
GitLab does not offer support via inbound or on-demand calls.

GitLab Support Engineers communicate with you about your tickets primarily through updates in the tickets themselves. At times it may be useful and important to conduct a call, video call, or screensharing session with you to improve the progress of a ticket. The support engineer may suggest a call for that reason. You may also request a call if you feel one is needed. Either way, the decision to conduct a call always rests with the support engineer, who will determine:

* whether a call is necessary; and
* whether we have sufficient information for a successful call.
`,
    "GitLab offers not support for in-bound phone calls."
)
console.log({ grounded })
