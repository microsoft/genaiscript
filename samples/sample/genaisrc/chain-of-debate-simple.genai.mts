/**
 * Simple Chain of Debate Example
 * 
 * A basic example showing a simplified version of the chain of debate pattern
 * with a simple question and fewer models for quick testing.
 */

script({
    title: "Simple Chain of Debate",
    description: "Basic example of multi-agent debate",
    model: "openai:gpt-4o-mini",
    cache: "simple-debate",
    temperature: 0.5,
})

const topic = "Is it better to work from home or in an office?"
const models = ["openai:gpt-4o-mini", "openai:gpt-35-turbo"]

const dbg = host.logger("chainofdebase")
dbg(`🎯 Simple debate: "${topic}"`)
dbg(`🤖 Models: ${models.join(", ")}`)

// Round 1: Initial positions
dbg("\n🚀 Round 1: Initial Positions")
const positions = await Promise.all(
    models.map(async (model, index) => {
        const { text } = await runPrompt(
            (_) => {
                _.$`You are participating in a brief debate on: ${topic}

Please provide your position in 2-3 sentences. Be clear and concise.

Your response should include:
- Your clear stance (home vs office or balanced view)
- One key supporting argument

Keep it brief and focused.`
            },
            {
                model,
                label: `simple-debate-initial-${index + 1}`,
                cache: "simple-debate",
            }
        )
        
        dbg(`\n📝 ${model}:`)
        dbg(text)
        return { model, text }
    })
)

// Round 2: Responses
dbg("\n🔄 Round 2: Responses")
const responses = await Promise.all(
    models.map(async (model, index) => {
        const otherPosition = positions.find(p => p.model !== model)
        
        const { text } = await runPrompt(
            (_) => {
                _.$`You are continuing the debate on: ${topic}

Your previous position: ${positions[index].text}

Other participant said: ${otherPosition?.text}

Now provide a brief response (2-3 sentences):
- Address one point from the other participant
- Strengthen or refine your position`
            },
            {
                model,
                label: `simple-debate-response-${index + 1}`,
                cache: "simple-debate",
            }
        )
        
        dbg(`\n📝 ${model} responds:`)
        dbg(text)
        return { model, text }
    })
)

dbg("\n✅ Simple debate completed!")

// Build markdown output using env.output
env.output.heading(1, "Simple Chain of Debate Results")

env.output.heading(2, `Topic: ${topic}`)

env.output.heading(3, "Round 1: Initial Positions")
for (const position of positions) {
    env.output.appendContent(`\n**${position.model}:**\n${position.text}\n`)
}

env.output.heading(3, "Round 2: Responses")
for (const response of responses) {
    env.output.appendContent(`\n**${response.model}:**\n${response.text}\n`)
}

env.output.heading(2, "Summary")
env.output.appendContent(`This simple example shows how two AI models can engage in a structured debate, with each providing initial positions and then responding to each other's arguments. Even with just two rounds, you can see how the debate evolves and models refine their positions based on the other's input.

This demonstrates the core concept of chain of debate: iterative argumentation that leads to more nuanced perspectives.`)