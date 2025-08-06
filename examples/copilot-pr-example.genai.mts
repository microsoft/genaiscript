script({
    title: "Create Copilot Pull Request Assistant",
    description: "Interactive script that helps create pull requests using the github.createCopilotPullRequest method",
    model: "large"
})

// Get current repository context if available
const repoFiles = env.files || []
const currentBranchResult = await host.exec("git branch --show-current")
const currentBranch = currentBranchResult.stdout?.trim() || "unknown"

// Use inline prompt to gather PR requirements
$`# Pull Request Creation Assistant

You are an expert at creating well-structured pull requests. Based on the current repository context, help me create a pull request.

## Current Context
- Repository: ${env.vars.github_repository || "current repository"}
- Current branch: ${currentBranch}
- Files in context: ${repoFiles.length > 0 ? repoFiles.map(f => f.filename).join(", ") : "none"}

## Task
Analyze the current repository state and suggest:
1. A descriptive title for a pull request
2. A detailed body describing the changes
3. Appropriate labels for the PR
4. Whether this should be a draft PR

Please provide your suggestions in the following format:

**Title:** [Your suggested title]

**Body:** [Detailed description of the changes]

**Labels:** [comma-separated list of suggested labels]

**Draft:** [true/false - whether this should be a draft]

**Branch Suffix:** [suggested branch suffix for copilot/ branch]

After your suggestions, I'll demonstrate how to use the github.createCopilotPullRequest method with your recommendations.
`

// Demonstrate the usage (this would normally use the AI response)
console.log("🤖 Demonstrating github.createCopilotPullRequest usage:")

// Example usage with the method
if (typeof github?.createCopilotPullRequest === 'function') {
    console.log("✅ github.createCopilotPullRequest method is available!")
    
    // Show example usage
    console.log(`
Example usage:

// Basic usage
const pr = await github.createCopilotPullRequest(
    "Fix authentication bug",
    "This PR resolves the authentication issue by updating token validation logic."
)

// Advanced usage with options
const pr = await github.createCopilotPullRequest(
    "Implement user dashboard feature",
    "Adds new user dashboard with metrics and settings panels.",
    {
        branchSuffix: "user-dashboard-feature",
        baseBranch: "dev", 
        draft: true,
        labels: ["feature", "copilot", "dashboard"]
    }
)

console.log("Created PR:", pr.html_url)
`)
} else {
    console.log("❌ github.createCopilotPullRequest method is not available")
}

if (typeof github?.createPullRequest === 'function') {
    console.log("✅ github.createPullRequest method is also available for direct API usage!")
} else {
    console.log("❌ github.createPullRequest method is not available")
}