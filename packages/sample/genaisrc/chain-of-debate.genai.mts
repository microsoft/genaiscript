script({
    title: "Chain of Debate",
    description:
        "Implements chain of debate between multiple AI models to reach consensus through structured discussion. Inspired by https://github.com/sukeesh/chain-of-debate/blob/main/main.py",
    model: "small", // Default model, can be overridden
    parameters: {
        question: {
            type: "string", 
            description: "The question or problem to debate",
            default: "Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?"
        },
        maxRounds: {
            type: "number",
            description: "Maximum number of debate rounds",
            default: 6
        },
        models: {
            type: "array",
            items: { type: "string" },
            description: "Array of model names to use in the debate",
            default: ["openai:gpt-4o-mini", "openai:gpt-3.5-turbo"]
        }
    }
})

// Configuration from parameters
const question = env.vars.question || "Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?"
const maxRounds = parseInt(env.vars.maxRounds || "6")
const debateModels = env.vars.models || ["openai:gpt-4o-mini", "openai:gpt-3.5-turbo"]

console.log(`🤔 Question: ${question}`)
console.log(`🔄 Max rounds: ${maxRounds}`)
console.log(`🤖 Models: ${debateModels.join(", ")}`)

/**
 * Generate a system prompt based on the debate phase and round number
 */
function getSystemPrompt(roundNum, maxRounds) {
    if (roundNum <= Math.floor(maxRounds / 2)) {
        // Early rounds: Exploration phase
        return `You are having a thoughtful discussion to explore different viewpoints on a question. 
Present your perspective clearly and thoroughly. If you see aspects the other viewpoint might be missing or 
considerations that weren't fully addressed, share those insights constructively.
Think step by step, then state your proposed answer prefixed with 'Answer:'.`
    } else {
        // Later rounds: Reflection phase
        return `You are in a reflective phase of the discussion. Consider both your original thoughts and the other perspective shared. 
Your goal is to provide the most thoughtful response - this might mean refining your view, finding common ground, or respectfully maintaining your position if you believe it's well-reasoned.
Think step by step, then state your proposed answer prefixed with 'Answer:'.`
    }
}

/**
 * Extract the final answer from a model's response
 */
function extractAnswer(text) {
    const lines = text.split('\n')
    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.toLowerCase().indexOf("answer:") === 0) {
            return trimmed.substring(7).trim() || null
        }
    }
    return null
}

/**
 * Check if a response shows explicit agreement with the previous response
 */
async function checkExplicitAgreement(response, previousResponse) {
    const agreementPrompt = `I will show you two responses in a discussion. Please respond ONLY with "Yes" if the second response 
explicitly agrees with or defers to the first response, or "No" if it maintains a different position.

Look for explicit agreement, concession, or acknowledgment that the other view is correct.

First response:
${previousResponse}
--------------------------------
Second response:
${response}`

    try {
        const result = await runPrompt(
            (ctx) => {
                ctx.$`${agreementPrompt}`
            },
            { 
                model: "small",
                system: "You determine if someone is explicitly agreeing with another person's viewpoint.",
                temperature: 0.0,
                cache: "agreement-check"
            }
        )
        
        const verdict = result.text.trim().toLowerCase()
        return verdict.indexOf("yes") === 0
    } catch (error) {
        console.warn(`Warning: Could not check agreement: ${error}`)
        return false // Default to no agreement if check fails
    }
}

/**
 * Check if two answers are semantically equivalent
 */
async function checkEquivalence(ans1, ans2) {
    const equivalencePrompt = `I will give you two proposed answers to the same question. 
Please respond ONLY with "Yes" if they are semantically equivalent (i.e., they mean the same thing), 
or "No" otherwise.

Answer A:
${ans1}
--------------------------------
Answer B:
${ans2}`

    try {
        const result = await runPrompt(
            (ctx) => {
                ctx.$`${equivalencePrompt}`
            },
            { 
                model: "small",
                system: "You compare two answers for semantic equivalence.",
                temperature: 0.0,
                cache: "equivalence-check"
            }
        )
        
        const verdict = result.text.trim().toLowerCase()
        return verdict.indexOf("yes") === 0
    } catch (error) {
        console.warn(`Warning: Could not check answer equivalence: ${error}`)
        return false // Default to not equivalent if check fails
    }
}

/**
 * Generate a response from a specific model in the debate
 */
async function generateDebateResponse(modelId, question, context, roundNum, maxRounds) {
    const systemPrompt = getSystemPrompt(roundNum, maxRounds)
    
    const result = await runPrompt(
        (ctx) => {
            if (context) {
                ctx.$`Opponent said:
${context}

`
            }
            ctx.$`${question}`
        },
        {
            model: modelId,
            system: systemPrompt,
            temperature: 0.0,
            cache: "debate",
            label: `${modelId}-round-${roundNum}`
        }
    )
    
    return result
}

/**
 * Main debate orchestrator
 */
async function conductDebate() {
    if (debateModels.length < 2) {
        throw new Error("At least 2 models are required for a debate")
    }

    const modelContexts = []
    for (let i = 0; i < debateModels.length; i++) {
        modelContexts.push("")
    }
    
    for (let round = 1; round <= maxRounds; round++) {
        console.log(`\n=== Round ${round} ===`)
        if (round <= Math.floor(maxRounds / 2)) {
            console.log("(Exploration phase: Each AI shares their perspective)")
        } else {
            console.log("(Reflection phase: AIs consider all viewpoints)")
        }

        const responses = []

        // Get response from each model
        for (let i = 0; i < debateModels.length; i++) {
            const model = debateModels[i]
            // Use context from the previous model's response (circular)
            const contextIndex = (i - 1 + debateModels.length) % debateModels.length
            const context = modelContexts[contextIndex] || null
            
            console.log(`\n--- ${model} responds ---`)
            const result = await generateDebateResponse(model, question, context, round, maxRounds)
            
            responses.push({ model, response: result })
            modelContexts[i] = result.text
            
            console.log(result.text)
        }

        // Extract answers from responses
        const answers = responses.map(r => ({
            model: r.model,
            answer: extractAnswer(r.response.text)
        }))

        // Check for explicit agreement between consecutive models
        for (let i = 0; i < responses.length - 1; i++) {
            const current = responses[i]
            const next = responses[i + 1]
            
            const agreesWithCurrent = await checkExplicitAgreement(next.response.text, current.response.text)
            if (agreesWithCurrent) {
                console.log(`\n🤝 ${next.model} explicitly agrees with ${current.model}! Discussion concluded.`)
                return current.response.text
            }
        }

        // Check for semantic equivalence between all pairs of answers
        const validAnswers = answers.filter(a => a.answer !== null)
        
        if (validAnswers.length >= 2) {
            for (let i = 0; i < validAnswers.length - 1; i++) {
                for (let j = i + 1; j < validAnswers.length; j++) {
                    const ans1 = validAnswers[i]
                    const ans2 = validAnswers[j]
                    
                    if (await checkEquivalence(ans1.answer, ans2.answer)) {
                        console.log(`\n🤝 ${ans1.model} and ${ans2.model} agree on: ${ans1.answer}`)
                        return ans1.answer
                    }
                }
            }
        }
    }

    // Fallback if no consensus reached
    console.log("\n⚠️ No consensus reached after max rounds. Returning first model's last response:")
    const firstModelAnswer = extractAnswer(modelContexts[0]) || modelContexts[0]
    return firstModelAnswer
}

// Run the debate
try {
    const finalAnswer = await conductDebate()
    
    const separator = "=================================================="
    console.log("\n" + separator)
    console.log("🎯 FINAL ANSWER")
    console.log(separator)
    console.log(finalAnswer)
    
    $`## Chain of Debate Results

**Question:** ${question}

**Models:** ${debateModels.join(", ")}

**Rounds:** ${maxRounds}

**Final Answer:** ${finalAnswer}

---

The chain of debate process allows multiple AI models to discuss and refine their perspectives through structured rounds of exploration and reflection, ultimately working toward consensus or identifying the most reasoned position.`

} catch (error) {
    console.error(`❌ Error during debate: ${error}`)
    $`## Chain of Debate Error

An error occurred during the debate process: ${error}

Please check:
1. That all specified models are available and configured
2. That API credentials are properly set
3. Network connectivity`
}