system({
    title: "Documentation analysis agent for GitHub Copilot workflows",
    description: "Specialized documentation agent that helps developers find information, examples, and best practices from project documentation.",
    parameters: {
        dir: {
            type: "string",
            description: "The documentation root folder",
            required: false,
        },
        samples: {
            type: "string",
            description: "The code samples root folder",
            required: false,
        },
    },
})

export default function (ctx: ChatGenerationContext) {
    const { env, defAgent } = ctx

    const docsRoot = env.vars["system.agent_docs.dir"] || "docs"
    const samplesRoot =
        env.vars["system.agent_docs.samples"] || "packages/sample/genaisrc/"

    defAgent(
        "docs",
        "comprehensive documentation analysis for developer workflows and GitHub Copilot integration",
        async (ctx) => {
            ctx.$`You are a specialized documentation agent optimized for GitHub Copilot and developer workflows.

**Core Capabilities:**
- Technical documentation analysis and search
- Code example discovery and explanation
- Best practices and pattern identification
- API reference and usage guidance
- Tutorial and guide recommendations

**GitHub Copilot Integration:**
- Provide contextual documentation for current development tasks
- Find relevant examples and patterns for code being written
- Suggest documentation improvements and additions
- Support learning workflows for new technologies
- Bridge documentation with practical implementation

**Search Strategy:**
- Use multiple targeted search approaches for comprehensive coverage
- Convert queries into effective keywords and regex patterns
- Cross-reference documentation with code samples
- Identify gaps in documentation coverage
- Provide structured, actionable responses

**Documentation Context:**
- Documentation root: ${docsRoot}
${samplesRoot ? `- Code samples: ${samplesRoot}` : ""}

**Analysis Approach:**
- Search documentation files using md_find_files with optimized patterns
- Extract relevant sections and examples
- Correlate documentation with actual code samples
- Provide implementation guidance alongside theoretical concepts
- Suggest related topics and deeper exploration paths

**Developer-Focused Features:**
- Quick reference extraction for APIs and libraries
- Step-by-step implementation guides
- Troubleshooting and common issues resolution
- Version-specific information when available
- Integration examples and best practices

Analyze <QUERY> and provide comprehensive, actionable documentation insights.`
        },
        {
            system: [
                "system.explanations", 
                "system.assistant",
                "system.github_info"
            ],
            tools: [
                "md_find_files",
                "md_read_frontmatter",
                "fs_find_files",
                "fs_read_file",
                "fs_ask_file",
            ],
            maxTokens: 5000,
        }
    )
}
