/*
 * Markdown image alt text updater
 */
script({
    title: "Image Alt Textify",
    description: "Generate alt text for images in markdown files",
    parameters: {
        docs: {
            type: "string",
            description: "path to search for markdown files",
            default: "docs",
        },
        force: {
            type: "boolean",
            description: "regenerate all descriptions",
            default: false,
        },
        assets: {
            type: "string",
            description: "image assets path",
            default: "./slides/public",
        },
        dryRun: {
            type: "boolean",
            description: "show matches, do not compute alt text",
            default: false,
        },
    },
})

/** ------------------------------------------------
 * Configuration
 */
const { docs, force, assets, dryRun } = env.vars

/** ------------------------------------------------
 * Helper functions (update as needed)
 */
/**
 *  Return the resolved url for the image
 */
const resolveUrl = (filename: string, url: string) => {
    // ignore external urls
    if (/^http?s:\/\//i.test(url)) return undefined
    // map / to assets
    else if (/^\//.test(url)) return path.join(assets, url.slice(1))
    // resolve local paths
    else return path.join(path.dirname(filename), url)
}

/** ------------------------------------------------
 * Collect files
 */
// search for ![](...) in markdown files and generate alt text for images
const rx = force // upgrade all urls
    ? // match ![alt](url) with any alt
      /!\[[^\]]*\]\(([^\)]+\.(png|jpg))\)/g
    : // match ![alt](url) where alt is empty
      /!\[\s*\]\(([^\)]+\.(png|jpg))\)/g
const { files } = await workspace.grep(rx, {
    path: docs,
    glob: "*.{md,mdx}",
    readText: true,
})

/** ------------------------------------------------
 * Generate alt text for images
 * and update markdown files
 */

// a cache of generated alt text for images
const imgs: Record<string, string> = {}

// process each file
for (const file of files) {
    const { filename, content } = file
    console.log(filename)
    const matches = content.matchAll(rx)
    // pre-compute matches
    for (const match of matches) {
        const url = match[1]
        if (imgs[url]) continue // already processed

        const resolvedUrl = resolveUrl(filename, url)
        if (!resolvedUrl) continue // can't process url
        console.log(`└─ ${resolvedUrl}`)

        if (dryRun) continue

        // execute a LLM query to generate alt text
        const { text, error } = await runPrompt(
            (_) => {
                _.defImages(resolvedUrl)
                _.$`
                You are an expert in assistive technology. 
                
                You will analyze the image 
                and generate a description alt text for the image.
                
                - Do not include alt text in the description.
                - Keep it short but descriptive.
                - Do not generate the [ character.`
            },
            {
                // safety system message to prevent generating harmful text
                system: [
                    "system.assistant",
                    "system.safety_jailbreak",
                    "system.safety_harmful_content",
                    "system.safety_validate_harmful_content",
                ],
                maxTokens: 4000,
                temperature: 0.5,
                cache: "alt-text",
                label: `altextify ${resolvedUrl}`,
            }
        )
        if (error) throw error
        else if (!text) console.log(`.. no description generated`)
        else imgs[url] = text.replace(/\[/g, "") // remove [ from alt text
    }
    // apply replacements
    const newContent = content.replace(
        rx,
        (m, url) => `![${imgs[url] ?? ""}](${url})`
    )
    // save updated content
    if (newContent !== content) {
        console.log(`.. updating ${filename}`)
        await workspace.writeText(filename, newContent)
    }
}
