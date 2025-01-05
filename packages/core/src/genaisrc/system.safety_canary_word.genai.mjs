system({
    title: "Canary World Prompt Leak protection",
    description:
        "Injects a canary word into the system prompts and monitor the generated output for leaks.",
})

export default function main(ctx) {
    const adjectives = [
        "Zephyr",
        "Lunar",
        "Thunder",
        "Velvet",
        "Ember",
        "Quartz",
        "Solar",
        "Neon",
        "Mystic",
        "Blaze",
        "Granite",
        "Crystal",
        "Wisp",
        "Phantom",
        "Mirage",
        "Starling",
        "Dusk",
        "Vortex",
        "Fable",
        "Sonic",
        "Tempest",
    ]
    const nouns = [
        "Fox",
        "Pineapple",
        "Cactus",
        "Lion",
        "Serpent",
        "Butterfly",
        "Frost",
        "Badger",
        "Tulip",
        "Kangaroo",
        "Falcon",
        "Tiger",
        "Cedar",
        "Orchid",
        "Swan",
        "Ash",
        "Nettle",
        "Otter",
        "Birch",
        "Aspen",
        "Gazelle",
    ]

    const canaries = Array(2)
        .fill(0)
        .map(
            () =>
                adjectives[Math.floor(Math.random() * adjectives.length)] +
                nouns[Math.floor(Math.random() * nouns.length)]
        )

    ctx.$`${canaries.join(", ")}.`

    ctx.defChatParticipant((ctx, messages) => {
        const assistants = messages.filter(({ role }) => role === "assistant")
        const matches = assistants.filter(({ content }) =>
            canaries.some((canary) => content.includes(canary))
        )
        if (matches.length > 0)
            throw new Error("Canary word detected in assistant message")
    })
}
