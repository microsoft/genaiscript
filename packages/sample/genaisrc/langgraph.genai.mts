import { task, entrypoint, interrupt, MemorySaver } from "@langchain/langgraph"

script({
    title: "Deep Research Program",
    description: "A research workflow using LangGraph and GenAIScript",
    model: "large", // Use a capable model for research tasks
})

// Task: Break down research question into sub-questions
const breakdownResearch = task(
    "breakdown_research",
    async (question: string) => {
        const result = await runPrompt(
            async (ctx) => {
                ctx.$`You are an expert research strategist.

Task: Break down the following research question into 3-5 focused sub-questions that would help comprehensively answer the main question.

Research question: ${question}

For each sub-question:
1. Assign a unique ID (e.g., SQ1, SQ2)
2. Explain the rationale for why this sub-question is important
3. Ensure the sub-questions collectively cover the main research question

Output the breakdown as a JSON object.`
            },
            {
                responseSchema: {
                    type: "object",
                    properties: {
                        mainQuestion: { type: "string" },
                        subQuestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    question: { type: "string" },
                                    rationale: { type: "string" },
                                },
                            },
                        },
                    },
                },
            }
        )

        return result.json
    }
)

// Task: Research a specific sub-question
const researchSubQuestion = task(
    "research_subquestion",
    async (subQuestion: { id: string; question: string }) => {
        const result = await runPrompt(
            async (ctx) => {
                ctx.$`You are an expert researcher with access to comprehensive information.
    
Task: Thoroughly research the following question and provide a detailed answer.

Question ID: ${subQuestion.id}
Question: ${subQuestion.question}

Provide your findings in a structured format that includes:
- Your answer to the sub-question
- Relevant sources that support your answer
- Your confidence level in the answer (0-1)`
            },
            {
                system: ["system.retrieval_web_search"],
                responseSchema: {
                    type: "object",
                    properties: {
                        subQuestionId: { type: "string" },
                        answer: { type: "string" },
                        sources: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    url: { type: "string" },
                                    relevance: { type: "string" },
                                },
                            },
                        },
                        confidence: { type: "number" },
                    },
                },
            }
        )

        return result.json
    }
)

// Task: Synthesize findings into a coherent response
const synthesizeFindings = task(
    "synthesize_findings",
    async (mainQuestion: string, findings: any[]) => {
        const result = await runPrompt(
            async (ctx) => {
                ctx.$`You are an expert research synthesizer.
    
Task: Synthesize the following research findings into a coherent response to the main research question.

Main Research Question: ${mainQuestion}

Findings:
${JSON.stringify(findings, null, 2)}

Provide a synthesis that:
1. Directly answers the main research question
2. Integrates the findings from all sub-questions
3. Identifies limitations in the current research
4. Suggests next steps for further investigation`
            },
            {
                responseSchema: {
                    type: "object",
                    properties: {
                        summary: { type: "string" },
                        findings: { type: "array", items: { type: "string" } },
                        limitations: {
                            type: "array",
                            items: { type: "string" },
                        },
                        nextSteps: { type: "array", items: { type: "string" } },
                    },
                },
            }
        )

        return result.json
    }
)

// Main research workflow
const researchWorkflow = entrypoint(
    { checkpointer: new MemorySaver(), name: "research_workflow" },
    async (input: { question: string; context?: string }) => {
        // Step 1: Break down the research question
        const breakdown = await breakdownResearch(input.question)

        // Optional human review of breakdown
        const approvedBreakdown = interrupt({
            breakdown,
            action: "Please review the research question breakdown",
        })

        // Use the approved breakdown or the original if not modified
        const finalBreakdown = approvedBreakdown || breakdown

        // Step 2: Research each sub-question in parallel
        const subQuestionFindings = await Promise.all(
            finalBreakdown.subQuestions.map((sq) => researchSubQuestion(sq))
        )

        // Step 3: Synthesize the findings
        const synthesis = await synthesizeFindings(
            input.question,
            subQuestionFindings
        )

        // Return the final research output
        return {
            question: input.question,
            breakdown: finalBreakdown,
            findings: subQuestionFindings,
            synthesis: synthesis,
        }
    }
)

// Get the research question from input or use default
const researchQuestion =
    env.vars.question ||
    "What are the most promising approaches to climate change mitigation?"

// Execute the workflow
$`Starting deep research on question: "${researchQuestion}"

This workflow will break down your question into sub-questions, research each one,
and then synthesize the findings. Human input will be requested at key points.
`

// Define a unique thread ID for this research session
const threadId = `research-${Date.now()}`

// Configuration for the workflow
const config = {
    configurable: {
        thread_id: threadId,
    },
}

// Execute the research workflow
try {
    const results = await researchWorkflow.invoke(
        {
            question: researchQuestion,
            context: env.vars.context || "",
        },
        config
    )

    // Output the research results
    defFileOutput("research-results.json", "Research results in JSON format")
} catch (error) {
    if (error.message.includes("__interrupt__")) {
        $`Research paused for human input. Please provide feedback and run the script again to resume.`
    } else {
        $`An error occurred: ${error.message}`
    }
}
