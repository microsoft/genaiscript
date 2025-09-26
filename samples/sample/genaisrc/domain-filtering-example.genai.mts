// Example demonstrating domain filtering for HTTPS resources
// This script shows how to configure allowed domains for resource resolution

script({
    title: "Domain Filtering Example",
    description: "Demonstrates how GenAIScript filters domains for HTTPS resource access",
})

// This will work by default (GitHub domains are allowed by default)
try {
    const githubReadme = await host.resolveResource("https://raw.githubusercontent.com/microsoft/genaiscript/main/README.md")
    console.log("✅ GitHub access allowed:", githubReadme?.uri.hostname)
} catch (error) {
    console.log("🚫 GitHub access blocked:", error.message)
}

// This would be blocked unless explicitly allowed
try {
    const externalResource = await host.resolveResource("https://httpbin.org/get")
    if (externalResource) {
        console.log("✅ External resource allowed:", externalResource.uri.hostname)
    } else {
        console.log("🚫 External resource blocked: returned undefined")
    }
} catch (error) {
    console.log("🚫 External resource blocked:", error.message)
}

// Configuration examples:

console.log("\n📋 Configuration Examples:")
console.log("\n1. Environment Variable (comma-separated):")
console.log("   GENAISCRIPT_ALLOWED_DOMAINS=github.com,*.github.com,*.githubusercontent.com,*.openai.com")

console.log("\n2. Environment Variable (YAML array):")
console.log('   GENAISCRIPT_ALLOWED_DOMAINS=\'["github.com", "*.github.com", "*.githubusercontent.com", "*.openai.com"]\'')

console.log("\n3. Config File (genaiscript.config.yml):")
console.log("   allowedDomains:")
console.log("     - github.com")
console.log("     - '*.github.com'")
console.log("     - '*.githubusercontent.com'")
console.log("     - '*.openai.com'")

console.log("\n4. Config File (genaiscript.config.json):")
console.log("   {")
console.log('     "allowedDomains": ["github.com", "*.github.com", "*.githubusercontent.com", "*.openai.com"]')
console.log("   }")

console.log("\n🔧 Supported wildcard patterns:")
console.log("   • Exact match: github.com")
console.log("   • Subdomain wildcard: *.github.com (matches api.github.com)")
console.log("   • Global wildcard: * (allows all domains - use with caution)")