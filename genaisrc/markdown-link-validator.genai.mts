script({
    title: "Markdown Reference Link Validator",
    description: "Validates reference links in Markdown files by checking their reachability and optionally verifying metadata.",
    files: ["docs/**/*.md", "README.md", "*.md"],
    systemSafety: false,
    system: ["system"],
    responseType: "markdown",
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
const urlCache = new Map<string, LinkValidationResult>()

async function validateUrl(url: string, expectedTitle?: string): Promise<Omit<LinkValidationResult, "label" | "filename">> {
    // Check cache first
    if (urlCache.has(url)) {
        const cached = urlCache.get(url)!
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
            urlCache.set(url, { ...result, label: "", filename: "" })
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
            urlCache.set(url, { ...result, label: "", filename: "" })
            return result
        }

        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

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
                urlCache.set(url, { ...result, label: "", filename: "" })
                return result
            }

            // Check content type and extract title if needed
            let actualTitle: string | undefined
            const contentType = response.headers.get("content-type")
            
            if (expectedTitle && contentType?.includes("text/html")) {
                try {
                    const html = await response.text()
                    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
                    actualTitle = titleMatch?.[1]?.trim()
                    
                    // Check for title mismatch
                    if (actualTitle && expectedTitle) {
                        const titleMatches = actualTitle.toLowerCase().includes(expectedTitle.toLowerCase()) ||
                                           expectedTitle.toLowerCase().includes(actualTitle.toLowerCase())
                        
                        if (!titleMatches) {
                            const result = {
                                url,
                                title: expectedTitle,
                                status: "mismatch" as const,
                                statusCode: response.status,
                                statusText: response.statusText,
                                actualTitle
                            }
                            urlCache.set(url, { ...result, label: "", filename: "" })
                            return result
                        }
                    }
                } catch (error) {
                    // If we can't parse HTML, that's okay - just mark as valid
                }
            }

            const result = {
                url,
                title: expectedTitle,
                status: "valid" as const,
                statusCode: response.status,
                statusText: response.statusText,
                actualTitle
            }
            urlCache.set(url, { ...result, label: "", filename: "" })
            return result

        } catch (fetchError) {
            clearTimeout(timeoutId)
            
            if (fetchError.name === "AbortError") {
                const result = {
                    url,
                    title: expectedTitle,
                    status: "timeout" as const,
                    errorMessage: "Request timeout (10s)"
                }
                urlCache.set(url, { ...result, label: "", filename: "" })
                return result
            }

            const result = {
                url,
                title: expectedTitle,
                status: "broken" as const,
                errorMessage: fetchError.message
            }
            urlCache.set(url, { ...result, label: "", filename: "" })
            return result
        }

    } catch (error) {
        const result = {
            url,
            title: expectedTitle,
            status: "broken" as const,
            errorMessage: error.message
        }
        urlCache.set(url, { ...result, label: "", filename: "" })
        return result
    }
}

async function extractReferenceLinks(file: WorkspaceFile): Promise<LinkValidationResult[]> {
    try {
        // Try to dynamically import the mdast plugin
        const { mdast } = await import("@genaiscript/plugin-mdast")
        const { parse, visit } = await mdast()
        
        const ast = parse(file)
        const links: LinkValidationResult[] = []

        visit(ast, "definition", (node: any) => {
            if (node.url && node.identifier) {
                links.push({
                    label: node.identifier,
                    url: node.url,
                    title: node.title || undefined,
                    status: "valid", // Will be updated during validation
                    filename: file.filename
                })
            }
        })

        return links
    } catch (error: any) {
        console.warn(`Failed to import mdast or parse ${file.filename}: ${error.message}`)
        
        // Fallback: simple regex-based parsing for reference definitions
        const content = file.content || ""
        const links: LinkValidationResult[] = []
        
        // Match reference link definitions: [label]: url "optional title"
        // URL should start with http:// or https:// or be a valid relative path
        const refLinkRegex = /^\s*\[([^\]]+)\]:\s+((?:https?:\/\/|\.?\/)[^\s]+|\S+\.[a-zA-Z]{2,})(?:\s+"([^"]*)")?\s*$/gm
        let match
        
        while ((match = refLinkRegex.exec(content)) !== null) {
            const [, label, url, title] = match
            links.push({
                label: label.toLowerCase(), // Reference labels are case-insensitive
                url: url,
                title: title || undefined,
                status: "valid", // Will be updated during validation
                filename: file.filename
            })
        }
        
        return links
    }
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
    
    // Validate each unique URL
    const uniqueUrls = new Set(allLinks.map(link => link.url))
    console.log(`🌐 Validating ${uniqueUrls.size} unique URLs...`)

    // Validate URLs with limited concurrency
    const concurrencyLimit = 5
    const urlPromises: Promise<void>[] = []
    const urls = Array.from(uniqueUrls)
    
    for (let i = 0; i < urls.length; i += concurrencyLimit) {
        const batch = urls.slice(i, i + concurrencyLimit)
        
        const batchPromises = batch.map(async (url) => {
            // Find a link with this URL to get the expected title
            const linkWithTitle = allLinks.find(link => link.url === url && link.title)
            await validateUrl(url, linkWithTitle?.title)
        })
        
        urlPromises.push(...batchPromises)
        
        // Wait for current batch before processing next
        await Promise.allSettled(batchPromises)
    }

    // Update all links with validation results
    const validatedLinks = allLinks.map(link => {
        const cached = urlCache.get(link.url)
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
    if (brokenLinks.length === 0 && contentMismatches.length === 0) {
        output += "✅ **All reference links are valid!**\n\n"
    } else {
        output += `❌ Found ${brokenLinks.length} broken links and ${contentMismatches.length} content mismatches.\n\n`
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

    // Content mismatches section
    if (contentMismatches.length > 0) {
        output += `## ⚠️ Content Mismatches (${contentMismatches.length})\n\n`
        
        const mismatchByFile = contentMismatches.reduce((acc, link) => {
            if (!acc[link.filename]) acc[link.filename] = []
            acc[link.filename].push(link)
            return acc
        }, {} as Record<string, LinkValidationResult[]>)

        for (const [filename, links] of Object.entries(mismatchByFile)) {
            output += `### ${filename}\n\n`
            for (const link of links) {
                output += `- **[${link.label}]** → ${link.url}\n`
                output += `  - Expected title: "${link.title}"\n`
                output += `  - Actual title: "${link.actualTitle}"\n`
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
    } else if (report.contentMismatches.length > 0) {
        console.warn(`\n⚠️ Validation completed with warnings: ${report.contentMismatches.length} content mismatches found.`)
        // Exit 0 for mismatches - these are warnings, not hard failures
    } else {
        console.log(`\n✅ Validation successful: All ${report.totalChecked} reference links are valid.`)
    }
    
} catch (error) {
    console.error(`\n💥 Validation error: ${error.message}`)
    process.exit && process.exit(1)
}