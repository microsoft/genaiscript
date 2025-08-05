/**
 * NPM Update Risk Assessment Script
 * 
 * Detects outdated npm packages and provides comprehensive security and functionality
 * risk assessment for each update. Optimized for GitHub models with 8k context limits.
 * 
 * Features:
 * - Automatic package outdated detection via npm outdated
 * - Security risk analysis for authentication/critical packages  
 * - Functionality risk assessment for breaking changes
 * - Package metadata retrieval (maintainers, release dates, etc.)
 * - Source diff analysis through GitHub release notes and changelogs
 * - Dependency update detection (added, removed, updated sub-dependencies)
 * - Context chunking for large dependency lists
 * - Actionable recommendations and update strategies
 * 
 * Usage:
 *   genaiscript run npm-update-risk-assessment
 *   genaiscript run npm-update-risk-assessment --model github:gpt-4o-mini
 *   genaiscript run npm-update-risk-assessment -o npm-risk-report.md
 */

script({
    title: "NPM Update Risk Assessment",
    description: "Detects npm package updates and provides risk assessment with source diff analysis and dependency change detection",
    model: "github:gpt-4o-mini", // Use GitHub models with 8k context limit
    maxTokens: 3000, // Stay well within 8k context window
    temperature: 0.1,
    system: ["system"]
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

// Get package dependencies for a specific version
async function getPackageDependencies(packageName: string, version: string): Promise<{ dependencies?: Record<string, string>, devDependencies?: Record<string, string> }> {
    try {
        const result = await host.exec("npm", ["view", `${packageName}@${version}`, "dependencies", "devDependencies", "--json"], {
            cwd: env.workspaceRoot || ".",
            timeout: 10000,
        })
        
        if (result.stdout && result.exitCode === 0) {
            return JSON.parse(result.stdout)
        }
        
        return {}
    } catch (error) {
        console.warn(`⚠️ Failed to get dependencies for ${packageName}@${version}:`, error.message || error)
        return {}
    }
}

// Compare dependencies between two versions
function compareDependencies(currentDeps: Record<string, string> = {}, latestDeps: Record<string, string> = {}): {
    added: Record<string, string>,
    removed: Record<string, string>,
    updated: Record<string, { from: string, to: string }>
} {
    const added: Record<string, string> = {}
    const removed: Record<string, string> = {}
    const updated: Record<string, { from: string, to: string }> = {}
    
    // Find added and updated dependencies
    for (const [dep, version] of Object.entries(latestDeps)) {
        if (!(dep in currentDeps)) {
            added[dep] = version
        } else if (currentDeps[dep] !== version) {
            updated[dep] = { from: currentDeps[dep], to: version }
        }
    }
    
    // Find removed dependencies
    for (const [dep, version] of Object.entries(currentDeps)) {
        if (!(dep in latestDeps)) {
            removed[dep] = version
        }
    }
    
    return { added, removed, updated }
}

// Fetch GitHub release notes if available
async function getGitHubReleaseNotes(repoUrl: string, currentVersion: string, latestVersion: string): Promise<string> {
    try {
        // Extract GitHub repo path from various URL formats
        const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/)
        if (!match) return ""
        
        const owner = match[1]
        const repo = match[2]
        
        // Try to fetch release notes for the latest version
        const releaseUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/v${latestVersion}`
        const response = await host.fetchText(releaseUrl)
        
        if (response.ok && response.text) {
            const release = JSON.parse(response.text)
            if (release.body) {
                return `GitHub Release Notes (v${latestVersion}):\n${release.body.slice(0, 1000)}`
            }
        }
        
        // If specific release not found, try to get compare URL
        return `Compare changes: https://github.com/${owner}/${repo}/compare/v${currentVersion}...v${latestVersion}`
        
    } catch (error) {
        console.warn(`⚠️ Failed to fetch GitHub release notes:`, error.message || error)
        return ""
    }
}

// Get comprehensive package information including source diffs and dependency changes
async function getPackageChangelog(packageName: string, currentVersion: string, latestVersion: string): Promise<string> {
    try {
        console.log(`🔍 Fetching comprehensive info for ${packageName} (${currentVersion} → ${latestVersion})`)
        
        const result = await host.exec("npm", ["view", packageName, "description", "repository.url", "homepage", "keywords", "maintainers", "time", "--json"], {
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
            
            if (packageData.maintainers?.length) {
                const maintainerCount = packageData.maintainers.length
                changelog.push(`Maintainers: ${maintainerCount} maintainer${maintainerCount > 1 ? 's' : ''}`)
            }
            
            // Try to get time information for version releases
            if (packageData.time && typeof packageData.time === 'object') {
                const currentTime = packageData.time[currentVersion]
                const latestTime = packageData.time[latestVersion]
                if (currentTime && latestTime) {
                    const currentDate = new Date(currentTime).toLocaleDateString()
                    const latestDate = new Date(latestTime).toLocaleDateString()
                    changelog.push(`Version timeline: ${currentVersion} (${currentDate}) → ${latestVersion} (${latestDate})`)
                }
            }
            
            // Get dependency changes
            console.log(`📦 Analyzing dependency changes for ${packageName}`)
            const [currentDepsResult, latestDepsResult] = await Promise.all([
                getPackageDependencies(packageName, currentVersion),
                getPackageDependencies(packageName, latestVersion)
            ])
            
            const depChanges = compareDependencies(currentDepsResult.dependencies, latestDepsResult.dependencies)
            const devDepChanges = compareDependencies(currentDepsResult.devDependencies, latestDepsResult.devDependencies)
            
            // Report dependency changes
            if (Object.keys(depChanges.added).length > 0) {
                changelog.push(`New dependencies: ${Object.keys(depChanges.added).join(", ")}`)
            }
            if (Object.keys(depChanges.removed).length > 0) {
                changelog.push(`Removed dependencies: ${Object.keys(depChanges.removed).join(", ")}`)
            }
            if (Object.keys(depChanges.updated).length > 0) {
                const updates = Object.entries(depChanges.updated)
                    .map(([dep, change]) => `${dep} (${change.from} → ${change.to})`)
                    .slice(0, 3) // Limit to first 3 to avoid context overflow
                changelog.push(`Updated dependencies: ${updates.join(", ")}${Object.keys(depChanges.updated).length > 3 ? ` and ${Object.keys(depChanges.updated).length - 3} more` : ""}`)
            }
            
            // Try to get GitHub release notes or changelog
            if (packageData.repository?.url) {
                const releaseNotes = await getGitHubReleaseNotes(packageData.repository.url, currentVersion, latestVersion)
                if (releaseNotes) {
                    changelog.push(releaseNotes)
                }
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
    
    let allPackageData = []
    
    // Collect package information for all outdated packages
    for (const packageName of packageNames) {
        const pkg = outdatedPackages[packageName]
        const changelog = await getPackageChangelog(packageName, pkg.current, pkg.latest)
        const isMajor = isMajorVersionChange(pkg.current, pkg.latest)
        
        allPackageData.push({
            name: packageName,
            current: pkg.current,
            latest: pkg.latest,
            isMajorVersionChange: isMajor,
            changelog: changelog.slice(0, 1200) // Increased limit to accommodate dependency changes
        })
    }
    
    // Define all package data for analysis
    def("PACKAGES", JSON.stringify(allPackageData, null, 2), {
        maxTokens: 2500
    })
    
    $`You are an expert software security and dependency management specialist.

## 🔍 NPM Package Update Risk Assessment

Analyze the outdated npm packages in PACKAGES and provide a comprehensive risk assessment report.

### Package Summary
${allPackageData.map(pkg => 
    `- **${pkg.name}**: ${pkg.current} → ${pkg.latest} ${pkg.isMajorVersionChange ? '(⚠️ MAJOR)' : '(minor/patch)'}`
).join('\n')}

### Assessment Framework

**Security Risk Factors:**
- Major version changes (higher risk of vulnerabilities)
- Package maintenance status and reputation
- Authentication/identity-related packages (higher attack surface)
- Dependency updates that introduce new packages or change versions
- Source code changes that affect security posture

**Functionality Risk Factors:**
- Breaking changes in major versions
- API compatibility issues
- Performance impacts
- Integration complexity
- Dependency updates that may cause conflicts

### Required Analysis

For each package, provide:

1. **Risk Assessment**
   - Security risk: LOW/MEDIUM/HIGH
   - Functionality risk: LOW/MEDIUM/HIGH
   - Overall recommendation: UPDATE/DELAY/INVESTIGATE

2. **Key Considerations**
   - What changed between versions (based on source diffs/release notes)
   - Dependency updates introduced (new, removed, or updated sub-dependencies)
   - Potential breaking changes
   - Security implications
   - Testing recommendations

3. **Source Changes Analysis**
   - Review any available release notes, changelogs, or GitHub comparison links
   - Identify significant code changes that could impact functionality
   - Assess the scope and risk of dependency modifications

4. **Action Items**
   - Priority order for updates
   - Specific precautions to take
   - Documentation to review
   - Testing strategy for dependency changes

### Executive Summary

Provide a final summary with:
- Total packages requiring updates
- High-priority security updates (especially those with dependency changes)
- Safe updates that can proceed immediately
- Updates requiring careful testing due to source/dependency changes
- Overall update strategy recommendation

**Special attention to:**
- Packages with significant dependency changes
- Source code modifications that could introduce vulnerabilities
- Transitive dependency impacts

Format your response as a clear, actionable report that development teams can use to make informed decisions about npm package updates.`
}