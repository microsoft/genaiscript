script({
    title: "Domain Filtering Demo",
    description: "Demonstrates script-level domain filtering configuration",
    
    // Configure allowed domains for this script
    allowedDomains: [
        "github.com",
        "*.githubusercontent.com", 
        "example.com",
        "*.example.org"
    ]
})

// This script demonstrates how to configure allowed domains at the script level
// The allowedDomains property overrides global configuration for this script

console.log("Script-level domain configuration demo")

// These should work with the script's allowed domains
const allowedUrls = [
    "https://github.com/microsoft/genaiscript",
    "https://raw.githubusercontent.com/microsoft/genaiscript/main/README.md",
    "https://example.com/test",
    "https://api.example.org/data"
]

// These should be blocked by the script's domain filtering
const blockedUrls = [
    "https://badsite.com/malicious",
    "https://api.openai.com/v1/chat/completions"  // Not in allowed list
]

console.log("Allowed domains for this script:")
console.log("- github.com")
console.log("- *.githubusercontent.com")
console.log("- example.com") 
console.log("- *.example.org")

$`
Test the domain filtering by attempting to fetch from various URLs.
This script should only be able to access domains listed in the allowedDomains configuration.

Try to explain the domain filtering feature and provide examples of:
1. Domains that should work with this script's configuration
2. Domains that should be blocked
3. How this differs from global domain configuration
`