import { getChatCompletions } from "coarch-core"
import { verboseLog } from "./log"

const model = "gpt-4"
const temperature = 0.2 // 0.0-2.0, defaults to 1.0
const max_tokens = 800

const subtasksSystem = `
You are an AI assistant that helps people create applications by splitting tasks into subtasks
and generating code from natural language.
You are concise.
You answer in TypeScript with no markdown formatting.
`

const subtasksQuery = `
Write a TypeScript function signature and a short comment describing each subtask for a given task.
For example:
Task: 
`

export async function getSubtasks(q: { task: string }) {
    const r = await getChatCompletions({
        model,
        temperature,
        max_tokens,
        messages: [
            {
                role: "system",
                content: subtasksSystem,
            },
            {
                role: "user",
                content: subtasksQuery + q.task,
            },
        ],
    })
    verboseLog(r)
    return r
        .split(/^\d+\./m)
        .map((t) => t.trim())
        .filter(Boolean)
}
