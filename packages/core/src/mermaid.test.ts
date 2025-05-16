import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { mermaidParse } from "./mermaid"

describe("mermaidParse", () => {
    test("parses a valid flowchart", async () => {
        const input = `graph TD; A-->B;`
        const res = await mermaidParse(input)
        assert.strictEqual(res.error, undefined)
        assert.strictEqual(res.diagramType, "flowchart-v2")
    })

    test("parses a valid sequence diagram", async () => {
        const input = `sequenceDiagram\nAlice->>Bob: Hello Bob`
        const res = await mermaidParse(input)
        assert.strictEqual(res.error, undefined)
        assert.strictEqual(res.diagramType, "sequence")
    })

    test("returns error for invalid diagram", async () => {
        const input = `not a mermaid diagram`
        const res = await mermaidParse(input)
        assert.ok(res.error)
        assert.strictEqual(res.diagramType, undefined)
    })

    test("returns error for empty input", async () => {
        const input = ``
        const res = await mermaidParse(input)
        assert.ok(res.error)
        assert.strictEqual(res.diagramType, undefined)
    })
    test("class diagram", async () => {
        const input = `
classDiagram
    class PromptNode
    class MarkdownTrace
    class GenerationOptions
    class CancellationToken
    class Project
    class ExpansionVariables
    class PromptImage
    class PromptPrediction

    class ChatTurnGenerationContext
    class RunPromptContextNode
    class ChatGenerationContext

    class FileOutput
    class PromptTemplateString

    class RunPromptResult
    class RunPromptResultPromiseWithOptions

    class PromptGenerationConsole

    class WorkspaceFile

    class SpeechResult
    class TranscriptionResult

    class FileMergeHandler
    class ChatFunctionHandler
    class PromptOutputProcessorHandler
    class ToolCallback
    class McpServersConfig
    class McpServerConfig
    class DefToolOptions
    class PromptParametersSchema
    class JSONSchemaObject
    class PromptGenerator
    class PromptGeneratorOptions
    class DefAgentOptions
    class ChatParticipantHandler
    class ChatParticipantOptions
    class DefSchemaOptions
    class FileOutputOptions
    class ImageGenerationOptions
    class TranscriptionOptions
    class SpeechOptions

    class ModelConnectionOptions

    class RunPromptResultPromiseWithOptions{
        +options(v)
    }

    class RunPromptContextNode{
        +node: PromptNode
        +defAgent()
        +defTool()
        +defSchema()
        +defChatParticipant()
        +defFileOutput()
        +defOutputProcessor()
        +defFileMerge()
        +prompt()
        +runPrompt()
        +transcribe()
        +speak()
        +generateImage()
        +env
    }
    class ChatTurnGenerationContext{
        +node: PromptNode
        +writeText()
        +assistant()
        +$()
        +def()
        +defImages()
        +defData()
        +defDiff()
        +fence()
        +importTemplate()
        +console: PromptGenerationConsole
    }

    createChatTurnGenerationContext --> ChatTurnGenerationContext
    createChatGenerationContext --> RunPromptContextNode
    RunPromptContextNode --|> ChatTurnGenerationContext
    RunPromptContextNode --|> ChatGenerationContext
    RunPromptContextNode --> PromptNode
    RunPromptContextNode --> MarkdownTrace
    RunPromptContextNode --> Project
    RunPromptContextNode --> ExpansionVariables
    RunPromptContextNode --> PromptTemplateString
    RunPromptContextNode --> FileOutput
    RunPromptContextNode --> SpeechResult
    RunPromptContextNode --> TranscriptionResult
    RunPromptContextNode --> FileMergeHandler
    RunPromptContextNode --> PromptOutputProcessorHandler
    RunPromptContextNode --> ToolCallback
    RunPromptContextNode --> ChatFunctionHandler
    RunPromptContextNode --> McpServersConfig
    RunPromptContextNode --> DefToolOptions
    RunPromptContextNode --> PromptParametersSchema
    RunPromptContextNode --> JSONSchemaObject
    RunPromptContextNode --> PromptGenerator
    RunPromptContextNode --> PromptGeneratorOptions
    RunPromptContextNode --> DefAgentOptions
    RunPromptContextNode --> ChatParticipantHandler
    RunPromptContextNode --> ChatParticipantOptions
    RunPromptContextNode --> DefSchemaOptions
    RunPromptContextNode --> FileOutputOptions
    RunPromptContextNode --> ImageGenerationOptions
    RunPromptContextNode --> TranscriptionOptions
    RunPromptContextNode --> SpeechOptions
    RunPromptContextNode --> ModelConnectionOptions

    ChatTurnGenerationContext --> PromptNode
    ChatTurnGenerationContext --> PromptTemplateString
    ChatTurnGenerationContext --> FileOutput

    %% Relationships for interfaces and argument types
    PromptTemplateString <-- ChatTurnGenerationContext
    PromptGenerationConsole <-- ChatTurnGenerationContext : console
    PromptNode <-- ChatTurnGenerationContext : node

    %% Utility Return types
    RunPromptResultPromiseWithOptions --> RunPromptResult

    %% Usage (no inheritance detected in file on these)
    PromptNode <-- "node prop"

    %% Primitives and helpers not detailed for brevity`
        const res = await mermaidParse(input)
        assert(res.error)
    })

    test("parses a valid state diagram with labels", async () => {
        const input = `stateDiagram-v2
            [*] --> Still: Start
            Still --> Moving: Start Moving
            Moving --> Still: Stop Moving
            Moving --> Crash: Crash
            Crash --> [*]: Reset`
        const res = await mermaidParse(input)
        assert.strictEqual(res.error, undefined)
        assert.strictEqual(res.diagramType, "stateDiagram")
    })

    test("parses a valid c4 diagram with labels", async () => {
        const input = `C4Context
            title System Context diagram for Internet Banking System
            Enterprise_Boundary(b0, "BankingSystem") {
                Person(customer, "Personal Banking Customer", "A customer of the bank")
                System(banking_system, "Internet Banking System", "Allows customers to check their accounts")
                System_Ext(mail_system, "E-mail system", "Delivers e-mails")
            }`
        const res = await mermaidParse(input)
        assert.strictEqual(res.error, undefined)
        assert.strictEqual(res.diagramType, "c4")
    })
})
