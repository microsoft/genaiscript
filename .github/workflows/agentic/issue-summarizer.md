---
on:
  issues:
    types: [opened, edited]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to summarize'
        required: false
        type: number
permissions:
  contents: read
  issues: write
tools:
  github:
    allowed: [add_issue_comment, get_issue, list_issue_comments]
engine: claude
timeout_minutes: 15
---

# Issue Summarizer Agentic Workflow

This workflow uses a custom agentic engine to summarize GitHub issues using GenAIScript.

The workflow will:
1. Set up Node.js environment for the repository
2. Compile the GenAIScript CLI
3. Read the prompt template and convert it to a GenAIScript markdown file
4. Run the generated GenAIScript with MCP configuration for GitHub tools
5. Post the summary as a comment on the issue

## Context

Issue Number: ${{ github.event.issue.number || github.event.inputs.issue_number }}
Repository: ${{ github.repository }}
Event Type: ${{ github.event_name }}

Please analyze the current issue and provide a comprehensive summary including:
- Main problem or request description
- Key technical details mentioned
- Any proposed solutions or approaches
- Priority level assessment
- Suggested next steps or questions for clarification

Use the GenAIScript framework to process the issue content and generate an insightful summary that will help maintainers and contributors understand the issue quickly.