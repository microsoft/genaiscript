/**
 * Chain of Debate - Multi-Agent Debate System
 * 
 * This script implements a chain of debate pattern where multiple LLM models
 * engage in iterative rounds of debate on a given topic, building on each 
 * other's arguments to reach a more refined conclusion.
 * 
 * Inspired by: https://github.com/sukeesh/chain-of-debate/blob/main/main.py
 */

script({
    title: "Chain of Debate",
    description: "Multi-agent debate system with iterative rounds of argumentation",
    model: "openai:gpt-4o",
    cache: "chain-of-debate",
    temperature: 0.7,
})

interface ChainOfDebateOptions {
    /** The topic or question to debate */
    topic: string
    /** List of models to participate in the debate */
    models?: string[]
    /** Number of debate rounds */
    rounds?: number
    /** Whether to include a final synthesis */
    synthesize?: boolean
}

async function chainOfDebate(options: ChainOfDebateOptions) {
    const dbg = host.logger("chainofdebase")
    const {
        topic,
        models = ["openai:gpt-4o", "openai:gpt-4o-mini"],
        rounds = 3,
        synthesize = true,
    } = options

    dbg(`🎯 Starting Chain of Debate on: "${topic}"`)
    dbg(`🤖 Models: ${models.join(", ")}`)
    dbg(`🔄 Rounds: ${rounds}`)

    // Initialize debate state
    let debateHistory: Array<{
        round: number
        model: string
        position: string
        reasoning: string
    }> = []

    // Round 1: Initial positions
    dbg("\n🚀 Round 1: Initial Positions")
    const initialPositions = await Promise.all(
        models.map(async (model, index) => {
            const { text } = await runPrompt(
                (_) => {
                    _.$`You are participating in a structured debate on the following topic:

TOPIC: ${topic}

Please provide your initial position on this topic. Your response should include:
1. Your clear stance/position
2. Key arguments supporting your position
3. Evidence or reasoning behind your arguments

Be thoughtful, well-reasoned, and prepare to defend your position in subsequent rounds.

Format your response as:
**Position:** [Your clear stance]
**Arguments:** [Numbered list of key arguments]
**Reasoning:** [Detailed explanation of your logic]`
                },
                {
                    model,
                    label: `debate-initial-${index + 1}`,
                    cache: "chain-of-debate",
                }
            )

            const position = {
                round: 1,
                model,
                position: text,
                reasoning: text,
            }

            debateHistory.push(position)
            dbg(`\n📝 ${model}:`)
            dbg(text.substring(0, 200) + "...")

            return position
        })
    )

    // Iterative debate rounds
    for (let round = 2; round <= rounds; round++) {
        dbg(`\n🔄 Round ${round}: Responses and Rebuttals`)

        const roundResponses = await Promise.all(
            models.map(async (model, index) => {
                // Get other participants' latest positions
                const otherPositions = debateHistory
                    .filter((entry) => entry.round === round - 1 && entry.model !== model)
                    .map((entry, idx) => `**Participant ${idx + 1} (${entry.model}):**\n${entry.position}`)
                    .join("\n\n")

                const { text } = await runPrompt(
                    (_) => {
                        _.$`You are continuing a structured debate on: ${topic}

Your previous position was:
${debateHistory.find((entry) => entry.model === model && entry.round === round - 1)?.position}

Here are the other participants' positions from the previous round:
${otherPositions}

Now provide your response for Round ${round}. You should:
1. Address key points raised by other participants
2. Defend or refine your position based on their arguments
3. Present counter-arguments where appropriate
4. Acknowledge valid points made by others
5. Strengthen your overall argument

Format your response as:
**Refined Position:** [Your updated stance]
**Response to Others:** [Address specific points from other participants]
**Counter-Arguments:** [Challenge opposing views]
**Strengthened Reasoning:** [Enhanced logic and evidence]`
                    },
                    {
                        model,
                        label: `debate-round-${round}-${index + 1}`,
                        cache: "chain-of-debate",
                    }
                )

                const position = {
                    round,
                    model,
                    position: text,
                    reasoning: text,
                }

                debateHistory.push(position)
                dbg(`\n📝 ${model} (Round ${round}):`)
                dbg(text.substring(0, 200) + "...")

                return position
            })
        )
    }

    // Final synthesis (if enabled)
    let synthesis = ""
    if (synthesize) {
        dbg("\n🎯 Final Synthesis")

        const { text } = await runPrompt(
            (_) => {
                _.$`You are an impartial moderator analyzing a structured debate on: ${topic}

The debate involved ${models.length} participants over ${rounds} rounds. Here is the complete debate history:

${debateHistory
    .map((entry) => `**Round ${entry.round} - ${entry.model}:**\n${entry.position}`)
    .join("\n\n---\n\n")}

Please provide a comprehensive synthesis that:
1. Summarizes the key positions and how they evolved
2. Identifies areas of convergence and persistent disagreements
3. Evaluates the strength of different arguments
4. Provides a balanced conclusion that incorporates the best insights
5. Suggests potential areas for further exploration

Format your response as:
**Evolution of Debate:** [How positions changed over rounds]
**Key Insights:** [Most compelling arguments and evidence]
**Areas of Agreement:** [Where participants converged]
**Remaining Disagreements:** [Persistent differences]
**Balanced Conclusion:** [Synthesized perspective]
**Further Questions:** [Areas needing more exploration]`
            },
            {
                model: "openai:gpt-4o",
                label: "debate-synthesis",
                cache: "chain-of-debate",
            }
        )

        synthesis = text
        dbg("\n📊 Synthesis:")
        dbg(text.substring(0, 300) + "...")
    }

    return {
        topic,
        models,
        rounds,
        debateHistory,
        synthesis,
    }
}

// Example usage
const debateResult = await chainOfDebate({
    topic: "Should artificial intelligence development be regulated by governments?",
    models: ["openai:gpt-4o", "openai:gpt-4o-mini"],
    rounds: 3,
    synthesize: true,
})

// Output formatted results
$`# Chain of Debate Results

## Topic
${debateResult.topic}

## Participants
${debateResult.models.map((model, i) => `${i + 1}. ${model}`).join("\n")}

## Debate Evolution

${Object.entries(
    debateResult.debateHistory
        .reduce((acc, entry) => {
            const roundKey = `Round ${entry.round}`
            if (!acc[roundKey]) acc[roundKey] = []
            acc[roundKey].push(`**${entry.model}:**\n${entry.position}`)
            return acc
        }, {} as Record<string, string[]>)
)
    .map(([round, positions]) => `### ${round}\n\n${positions.join("\n\n---\n\n")}\n`)
    .join("\n")}

${debateResult.synthesis ? `## Final Synthesis\n${debateResult.synthesis}` : ""}

## Summary
This chain of debate involved ${debateResult.models.length} AI models engaging in ${debateResult.rounds} rounds of structured argumentation. Each model provided initial positions and then refined their arguments based on others' contributions, demonstrating how multi-agent debate can lead to more nuanced understanding of complex topics.

The debate process helps surface different perspectives, strengthen weak arguments, and identify areas of agreement and disagreement in a systematic way.
`