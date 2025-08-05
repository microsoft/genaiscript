script({
    title: "NPM Update Risk Assessment",
    description: "Detects npm package updates and provides risk assessment with changelog analysis",
    model: "echo", // Use echo model for testing without API requirements
    maxTokens: 4000,
    temperature: 0.1,
})

// Interface for npm outdated output
interface NpmOutdatedPackage {
    current: string
    wanted: string
    latest: string
    dependent: string
    location: string
}

interface NpmOutdated {
    [packageName: string]: NpmOutdatedPackage
}

interface PackageRiskAssessment {
    packageName: string
    currentVersion: string
    latestVersion: string
    majorVersionChange: boolean
    changelogSummary: string
    securityRisk: "low" | "medium" | "high"
    functionalityRisk: "low" | "medium" | "high"
    recommendation: string
}

// Get outdated packages using npm
async function getOutdatedPackages(): Promise<NpmOutdated> {
    try {
        console.log("🔍 Running npm outdated...")
        const result = await host.exec("npm", ["outdated", "--json"], {
            cwd: env.workspaceRoot || ".",
            timeout: 30000,
        })
        
        console.log(`📦 npm outdated result: exit code ${result.exitCode}`)
        console.log(`📦 npm outdated stdout length: ${result.stdout?.length || 0}`)
        console.log(`📦 npm outdated stderr length: ${result.stderr?.length || 0}`)
        
        // Check stderr first in case npm outputs JSON there (common with error exit codes)
        if (result.stderr && result.stderr.trim()) {
            console.log(`📦 Raw stderr: ${result.stderr.slice(0, 200)}...`)
            
            // Try to extract JSON from stderr (might be wrapped in error message)
            const jsonMatch = result.stderr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0])
                    console.log(`📋 Found ${Object.keys(parsed).length} outdated packages (from stderr)`)
                    return parsed as NpmOutdated
                } catch (parseError) {
                    console.log("ℹ️ stderr JSON extraction failed, checking stdout...")
                }
            }
        }
        
        // npm outdated returns exit code 1 when packages are outdated, but still provides JSON
        if (result.stdout && result.stdout.trim()) {
            console.log(`📦 Raw stdout: ${result.stdout.slice(0, 200)}...`)
            try {
                const parsed = JSON.parse(result.stdout)
                console.log(`📋 Found ${Object.keys(parsed).length} outdated packages (from stdout)`)
                return parsed as NpmOutdated
            } catch (parseError) {
                console.warn("⚠️ Failed to parse npm outdated JSON:", parseError.message)
                console.warn("⚠️ Raw stdout:", result.stdout)
                return {}
            }
        }
        
        console.log("ℹ️ No outdated packages found (no parseable JSON)")
        return {}
    } catch (error) {
        console.warn("⚠️ Failed to get outdated packages:", error.message || error)
        return {}
    }
}

// Get package changelog from npm registry
async function getPackageChangelog(packageName: string, currentVersion: string, latestVersion: string): Promise<string> {
    try {
        console.log(`🔍 Fetching info for ${packageName} (${currentVersion} → ${latestVersion})`)
        
        const result = await host.exec("npm", ["view", packageName, "--json"], {
            cwd: env.workspaceRoot || ".",
            timeout: 15000,
        })
        
        if (result.stdout && result.exitCode === 0) {
            const packageData = JSON.parse(result.stdout)
            
            // Extract relevant information
            const changelog = []
            
            if (packageData.description) {
                changelog.push(`Description: ${packageData.description}`)
            }
            
            if (packageData.repository?.url) {
                changelog.push(`Repository: ${packageData.repository.url}`)
            }
            
            if (packageData.homepage) {
                changelog.push(`Homepage: ${packageData.homepage}`)
            }
            
            if (packageData.keywords?.length) {
                changelog.push(`Keywords: ${packageData.keywords.slice(0, 5).join(", ")}`)
            }
            
            changelog.push(`Version update: ${currentVersion} → ${latestVersion}`)
            
            return changelog.length > 0 ? changelog.join("\n") : "Package info retrieved"
        }
        
        return `Unable to fetch package information (exit code: ${result.exitCode})`
        
    } catch (error) {
        console.warn(`⚠️ Failed to get info for ${packageName}:`, error.message || error)
        return `Error fetching package info: ${error.message || "Unknown error"}`
    }
}

// Analyze semantic version changes
function isMajorVersionChange(current: string, latest: string): boolean {
    const currentParts = current.split('.').map(Number)
    const latestParts = latest.split('.').map(Number)
    
    if (currentParts.length < 1 || latestParts.length < 1) return false
    
    return latestParts[0] > currentParts[0]
}

// Main execution
console.log("🔍 Detecting outdated npm packages...")

const outdatedPackages = await getOutdatedPackages()
const packageNames = Object.keys(outdatedPackages)

if (packageNames.length === 0) {
    $`All npm packages are up to date! ✅ No updates needed.`
} else {
    console.log(`📦 Found ${packageNames.length} outdated packages`)
    
    // Process packages in chunks to respect context limits
    const chunkSize = 3 // Process 3 packages at a time to stay within 8k token limit
    const chunks = []
    
    for (let i = 0; i < packageNames.length; i += chunkSize) {
        chunks.push(packageNames.slice(i, i + chunkSize))
    }
    
    const allAssessments: PackageRiskAssessment[] = []
    
    for (const [chunkIndex, chunk] of chunks.entries()) {
        console.log(`📋 Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} packages)`)
        
        const packageData = []
        
        for (const packageName of chunk) {
            const pkg = outdatedPackages[packageName]
            const changelog = await getPackageChangelog(packageName, pkg.current, pkg.latest)
            const isMajor = isMajorVersionChange(pkg.current, pkg.latest)
            
            packageData.push({
                name: packageName,
                current: pkg.current,
                latest: pkg.latest,
                isMajorVersionChange: isMajor,
                changelog: changelog.slice(0, 1000) // Limit changelog length
            })
        }
        
        // Define the package data for analysis
        def("PACKAGES", JSON.stringify(packageData, null, 2), {
            maxTokens: 2000
        })
        
        $`You are an expert software security and dependency management specialist.

## Task
Analyze the provided npm package updates and provide a comprehensive risk assessment.

For each package in PACKAGES, provide:

1. **Security Risk Assessment** (low/medium/high):
   - Check if it's a major version change (higher risk)
   - Consider the package importance and potential attack surface
   - Look for any security-related mentions in changelog

2. **Functionality Risk Assessment** (low/medium/high):
   - Major version changes typically have breaking changes (high risk)
   - Minor/patch versions usually safer (low-medium risk)
   - Consider the package's role in the application

3. **Recommendation**:
   - Whether to update immediately, delay, or investigate further
   - Any specific precautions to take

## Output Format
For each package, provide a JSON object with this structure:
\`\`\`json
{
  "packageName": "package-name",
  "currentVersion": "1.0.0", 
  "latestVersion": "2.0.0",
  "majorVersionChange": true,
  "changelogSummary": "Brief summary of key changes",
  "securityRisk": "low|medium|high",
  "functionalityRisk": "low|medium|high", 
  "recommendation": "Detailed recommendation with reasoning"
}
\`\`\`

Return only a JSON array containing the assessment objects for all packages.`
        
        // Wait for response and parse assessments
        // Note: In a real implementation, you'd capture the LLM response here
        // For now, we'll create a mock assessment
        for (const data of packageData) {
            allAssessments.push({
                packageName: data.name,
                currentVersion: data.current,
                latestVersion: data.latest,
                majorVersionChange: data.isMajorVersionChange,
                changelogSummary: "Analysis completed",
                securityRisk: data.isMajorVersionChange ? "medium" : "low",
                functionalityRisk: data.isMajorVersionChange ? "high" : "medium",
                recommendation: data.isMajorVersionChange 
                    ? "Review breaking changes before updating" 
                    : "Safe to update"
            })
        }
    }
    
    // Generate final summary report
    def("ASSESSMENTS", JSON.stringify(allAssessments, null, 2), {
        maxTokens: 3000
    })
    
    $`## 📊 NPM Update Risk Assessment Summary

You are provided with risk assessments for outdated npm packages in ASSESSMENTS.

Generate a comprehensive summary report with:

1. **Executive Summary**
   - Total packages analyzed
   - High risk updates requiring attention
   - Safe updates that can proceed

2. **Priority Actions**
   - List packages needing immediate attention (high risk)
   - Recommended update order

3. **Update Strategy**
   - Suggested approach for different risk categories
   - Testing recommendations

4. **Security Considerations**
   - Any security-related updates to prioritize
   - Packages to investigate for vulnerabilities

Format the output as a clear, actionable markdown report that developers can use to make informed decisions about npm package updates.`
}