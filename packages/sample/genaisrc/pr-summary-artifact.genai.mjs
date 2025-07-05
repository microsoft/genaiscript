script({
    title: "PR Summary from Artifact",
    description: "Generate a pull request summary from a diff stored in an artifact",
    temperature: 0.5,
    systemSafety: true,
    system: [
        "system",
        "system.output_markdown", 
        "system.assistant",
        "system.english",
        "system.diff"
    ],
    parameters: {
        diffFile: {
            type: "string",
            description: "Path to the diff file from the artifact",
        },
        metadataFile: {
            type: "string", 
            description: "Path to the PR metadata file from the artifact",
        },
    },
})

const diffFile = env.vars.diffFile
const metadataFile = env.vars.metadataFile

// Read the diff file from artifact
let diffContent = ""
if (diffFile) {
    try {
        const diffData = await workspace.readText(diffFile)
        diffContent = diffData
        console.log(`Read diff file: ${diffFile} (${diffData.length} characters)`)
    } catch (error) {
        console.error(`Failed to read diff file ${diffFile}:`, error)
        cancel(`Cannot read diff file: ${diffFile}`)
    }
} else {
    cancel("No diff file specified")
}

// Read the metadata file from artifact
let metadata = ""
if (metadataFile) {
    try {
        metadata = await workspace.readText(metadataFile)
        console.log(`Read metadata file: ${metadataFile}`)
        console.log("Metadata:", metadata)
    } catch (error) {
        console.error(`Failed to read metadata file ${metadataFile}:`, error)
    }
}

// Check if diff is empty
if (!diffContent || diffContent.trim().length === 0) {
    cancel("The diff is empty - no changes to summarize")
}

// Define the diff content for the AI
def("GIT_DIFF", diffContent, {
    language: "diff",
    maxTokens: 20000,
})

// Define metadata if available
if (metadata) {
    def("PR_METADATA", metadata, {
        language: "text",
    })
}

// Task for summarizing the PR
$`You are an expert software developer and architect.
You are an expert at writing English technical documentation.

## Task

- Analyze the changes in GIT_DIFF and generate a high-level summary of what this pull request does
- This summary will be used to help reviewers understand the purpose and scope of the changes

## PR Context

${metadata ? "Use the PR_METADATA to understand the context of this pull request." : ""}

## Repository Context

This is the GenAIScript repository, which provides:
- A programmatic way to assemble prompts for LLMs using JavaScript
- Core functionality in \`packages/core/\`
- CLI tools in \`packages/cli/\`  
- Sample scripts in \`packages/sample/\`
- Documentation in \`docs/\`
- The public API is defined in "packages/core/src/prompt_template.d.ts" and "packages/core/src/prompt_type.ts"
- Changes in those files are "user facing"

## Instructions

- Write a clear, concise summary that explains the purpose of the changes
- Focus on the **intent** and **impact** of the changes, not implementation details  
- Use bullet points to organize different aspects of the changes
- Use emojis to make the summary more engaging and readable
- Highlight any breaking changes or significant architectural decisions
- Include the scope of files changed (frontend, backend, docs, tests, etc.)
- Don't explain what a diff is - focus on what changed and why
- Ignore routine changes like formatting, imports, or generated files
- Pay special attention to changes in core API files as these affect users

## Output Format

Structure your response as:

**Summary**: One paragraph describing the overall purpose

**Key Changes**:
- 🔧 **[Category]**: Description of changes
- 📝 **[Category]**: Description of changes  
- 🧪 **[Category]**: Description of changes

**Impact**: 
- Who this affects (users, developers, etc.)
- Any breaking changes or migration notes
- Performance, security, or UX improvements
`