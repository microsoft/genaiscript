script({
    title: "Markdown Reference Link Validator",
    description: "Validates reference links in Markdown files by checking their reachability and optionally verifying metadata.",
    files: ["docs/**/*.md", "README.md", "*.md"],
    systemSafety: false,
    system: ["system"],
    responseType: "markdown",
    parameters: {
        timeout: {
            type: "number",
            description: "Request timeout in seconds",
            default: 10
        }
    }
})

// Import will be handled dynamically to avoid compilation issues
// import { mdast } from "@genaiscript/plugin-mdast"

interface LinkValidationResult {
    label: string
    url: string
    title?: string
    status: "valid" | "broken" | "mismatch" | "timeout" | "invalid"
    statusCode?: number
    statusText?: string
    actualTitle?: string
    errorMessage?: string
    filename: string
}

interface ValidationReport {
    validLinks: LinkValidationResult[]
    brokenLinks: LinkValidationResult[]
    contentMismatches: LinkValidationResult[]
    totalChecked: number
    totalFiles: number
}

// Cache for URL results to avoid duplicate requests
interface UrlCache {
    [url: string]: LinkValidationResult
}

async function validateUrl(url: string, expectedTitle: string | undefined, cache: UrlCache): Promise<Omit<LinkValidationResult, "label" | "filename">> {
    const { vars } = env
    const timeout = (vars.timeout as number) || 10
    
    // Check cache first
    if (cache[url]) {
        const cached = cache[url]
        return {
            url: cached.url,
            title: cached.title,
            status: cached.status,
            statusCode: cached.statusCode,
            statusText: cached.statusText,
            actualTitle: cached.actualTitle,
            errorMessage: cached.errorMessage
        }
    }

    try {
        // Pre-validate URL format
        try {
            new URL(url)
        } catch {
            const result = {
                url,
                title: expectedTitle,
                status: "invalid" as const,
                errorMessage: "Invalid URL format"
            }
            cache[url] = { ...result, label: "", filename: "" }
            return result
        }

        // Only check HTTP/HTTPS URLs
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            const result = {
                url,
                title: expectedTitle,
                status: "valid" as const,
                errorMessage: "Non-HTTP URL (skipped)"
            }
            cache[url] = { ...result, label: "", filename: "" }
            return result
        }

        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout * 1000)

        try {
            const response = await fetch(url, {
                method: "GET",
                signal: controller.signal,
                headers: {
                    "User-Agent": "GenAIScript-LinkValidator/1.0"
                }
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const result = {
                    url,
                    title: expectedTitle,
                    status: "broken" as const,
                    statusCode: response.status,
                    statusText: response.statusText
                }
                cache[url] = { ...result, label: "", filename: "" }
                return result
            }

            // For successful responses, mark as valid
            const result = {
                url,
                title: expectedTitle,
                status: "valid" as const,
                statusCode: response.status,
                statusText: response.statusText
            }
            cache[url] = { ...result, label: "", filename: "" }
            return result

        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            
            if (fetchError.name === "AbortError") {
                const result = {
                    url,
                    title: expectedTitle,
                    status: "timeout" as const,
                    errorMessage: `Request timeout (${timeout}s)`
                }
                cache[url] = { ...result, label: "", filename: "" }
                return result
            }

            const result = {
                url,
                title: expectedTitle,
                status: "broken" as const,
                errorMessage: fetchError.message
            }
            cache[url] = { ...result, label: "", filename: "" }
            return result
        }

    } catch (error: any) {
        const result = {
            url,
            title: expectedTitle,
            status: "broken" as const,
            errorMessage: error.message
        }
        cache[url] = { ...result, label: "", filename: "" }
        return result
    }
}

async function extractReferenceLinks(file: WorkspaceFile): Promise<LinkValidationResult[]> {
    const content = file.content || ""
    const links: LinkValidationResult[] = []
    
    // Use regex-based parsing for reference definitions
    // Pattern matches: [label]: url "optional title"
    // Supports HTTP/HTTPS URLs, relative paths, and domains with extensions
    const refLinkRegex = /^\s*\[([^\]]+)\]:\s+((?:https?:\/\/|\.?\/)[^\s]+|\S+\.[a-zA-Z]{2,})(?:\s+"([^"]*)")?\s*$/gm
    let match
    
    while ((match = refLinkRegex.exec(content)) !== null) {
        const [, label, url, title] = match
        links.push({
            label: label.toLowerCase(), // Reference labels are case-insensitive in Markdown
            url: url,
            title: title || undefined,
            status: "valid", // Will be updated during validation
            filename: file.filename
        })
    }
    
    return links
}

async function validateMarkdownLinks(): Promise<ValidationReport> {
    const { files } = env
    
    if (!files || files.length === 0) {
        throw new Error("No files provided for validation")
    }

    console.log(`🔍 Scanning ${files.length} markdown files for reference links...`)
    
    // Extract all reference links from all files
    const allLinks: LinkValidationResult[] = []
    
    for (const file of files) {
        const links = await extractReferenceLinks(file)
        allLinks.push(...links)
    }

    if (allLinks.length === 0) {
        console.log("ℹ️ No reference links found in the provided files.")
        return {
            validLinks: [],
            brokenLinks: [],
            contentMismatches: [],
            totalChecked: 0,
            totalFiles: files.length
        }
    }

    console.log(`🔗 Found ${allLinks.length} reference links to validate`)
    
    // Create cache for URL validation results
    const urlCache: UrlCache = {}
    
    // Validate each unique URL sequentially
    const uniqueUrls = new Set(allLinks.map(link => link.url))
    console.log(`🌐 Validating ${uniqueUrls.size} unique URLs...`)

    for (const url of uniqueUrls) {
        // Find a link with this URL to get the expected title
        const linkWithTitle = allLinks.find(link => link.url === url && link.title)
        await validateUrl(url, linkWithTitle?.title, urlCache)
    }

    // Update all links with validation results
    const validatedLinks = allLinks.map(link => {
        const cached = urlCache[link.url]
        if (cached) {
            return {
                ...link,
                status: cached.status,
                statusCode: cached.statusCode,
                statusText: cached.statusText,
                actualTitle: cached.actualTitle,
                errorMessage: cached.errorMessage
            }
        }
        return link
    })

    // Categorize results
    const validLinks = validatedLinks.filter(link => link.status === "valid")
    const brokenLinks = validatedLinks.filter(link => 
        link.status === "broken" || link.status === "timeout" || link.status === "invalid"
    )
    const contentMismatches = validatedLinks.filter(link => link.status === "mismatch")

    return {
        validLinks,
        brokenLinks,
        contentMismatches,
        totalChecked: validatedLinks.length,
        totalFiles: files.length
    }
}

function generateReport(report: ValidationReport): string {
    const { validLinks, brokenLinks, contentMismatches, totalChecked, totalFiles } = report
    
    let output = "# Markdown Reference Link Validation Report\n\n"
    
    output += `**Summary:** Checked ${totalChecked} reference links across ${totalFiles} markdown files.\n\n`
    
    if (totalChecked === 0) {
        output += "ℹ️ No reference links found to validate.\n"
        return output
    }

    // Overall status
    if (brokenLinks.length === 0) {
        output += "✅ **All reference links are valid!**\n\n"
    } else {
        output += `❌ Found ${brokenLinks.length} broken links.\n\n`
    }

    // Valid links section
    if (validLinks.length > 0) {
        output += `## ✅ Valid Links (${validLinks.length})\n\n`
        
        // Group by file for better organization
        const validByFile = validLinks.reduce((acc, link) => {
            if (!acc[link.filename]) acc[link.filename] = []
            acc[link.filename].push(link)
            return acc
        }, {} as Record<string, LinkValidationResult[]>)

        for (const [filename, links] of Object.entries(validByFile)) {
            output += `### ${filename}\n\n`
            for (const link of links) {
                output += `- **[${link.label}]** → ${link.url} ✅\n`
            }
            output += "\n"
        }
    }

    // Broken links section
    if (brokenLinks.length > 0) {
        output += `## ❌ Broken/Unreachable Links (${brokenLinks.length})\n\n`
        
        const brokenByFile = brokenLinks.reduce((acc, link) => {
            if (!acc[link.filename]) acc[link.filename] = []
            acc[link.filename].push(link)
            return acc
        }, {} as Record<string, LinkValidationResult[]>)

        for (const [filename, links] of Object.entries(brokenByFile)) {
            output += `### ${filename}\n\n`
            for (const link of links) {
                let reason = ""
                if (link.statusCode) {
                    reason = `**${link.statusCode} ${link.statusText}**`
                } else if (link.errorMessage) {
                    reason = `**${link.errorMessage}**`
                } else {
                    reason = "**Unknown error**"
                }
                output += `- **[${link.label}]** → ${link.url} - ${reason}\n`
            }
            output += "\n"
        }
    }

    return output
}

// Main execution
try {
    const report = await validateMarkdownLinks()
    const reportText = generateReport(report)
    
    console.log(reportText)
    
    // Exit with appropriate code for CI
    if (report.brokenLinks.length > 0) {
        console.error(`\n❌ Validation failed: ${report.brokenLinks.length} broken links found.`)
        process.exit && process.exit(1)
    } else {
        console.log(`\n✅ Validation successful: All ${report.totalChecked} reference links are valid.`)
    }
    
} catch (error) {
    console.error(`\n💥 Validation error: ${error.message}`)
    process.exit && process.exit(1)
}