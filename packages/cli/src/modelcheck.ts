import { runtimeHost } from "../../core/src/host"
import { resolveModelAlias } from "../../core/src/models"
import { YAMLStringify } from "../../core/src/yaml"
import { logInfo, logVerbose, logWarn } from "../../core/src/util"
import { run } from "./api"
import {
    LARGE_MODEL_ID,
    SMALL_MODEL_ID,
    VISION_MODEL_ID,
} from "../../core/src/constants"

/**
 * Checks each known model alias by making LLM requests and reports the results.
 * Tests if each alias works, what provider it uses, token usage, etc.
 * 
 * This function:
 * 1. Gets all known model aliases (core + configured)
 * 2. For each alias, resolves it to an actual model
 * 3. Makes a simple test LLM request
 * 4. Reports success/failure with detailed metrics
 * 5. Outputs a summary in YAML format
 */
export async function checkModelAliases() {
    await runtimeHost.readConfig()

    // Get all known model aliases
    const coreAliases = [
        LARGE_MODEL_ID,
        SMALL_MODEL_ID,
        VISION_MODEL_ID,
        "vision_small",
        "embeddings",
        "reasoning",
        "reasoning_small",
    ]

    // Get all configured aliases
    const configuredAliases = Object.keys(runtimeHost.modelAliases)

    // Combine and deduplicate
    const allAliases = [...new Set([...coreAliases, ...configuredAliases])].sort()

    logInfo(`Testing ${allAliases.length} model aliases...`)
    
    if (allAliases.length === 0) {
        logWarn("No model aliases found to test")
        return
    }
    
    logVerbose("")

    const results: Record<string, any> = {}

    for (const alias of allAliases) {
        logInfo(`Testing alias: ${alias}`)

        try {
            // Resolve the alias to see what model it points to
            const resolved = resolveModelAlias(alias)
            logVerbose(`  Resolved to: ${resolved || "undefined"}`)

            if (!resolved) {
                results[alias] = {
                    error: "Alias not resolved",
                    status: "failed",
                }
                logWarn(`  ❌ Failed: Alias not resolved`)
                continue
            }

            // Test the model by making a simple request
            const startTime = Date.now()
            const res = await run("model-alias-tester", [], {
                jsSource: `script({
    unlisted: true,
    system: [],
    systemSafety: false
})
$\`Write the word "hello" in lowercase.\`
`,
                model: alias, // Use the alias as the model parameter
                runTrace: false,
                temperature: 0,
                maxTokens: 10,
                timeout: 30000,
            })
            const duration = Date.now() - startTime

            if (!res || res.error) {
                results[alias] = {
                    model: resolved,
                    error: res?.error || "Unknown error",
                    status: "failed",
                    duration,
                }
                logWarn(`  ❌ Failed: ${res?.error || "Unknown error"}`)
            } else {
                // Extract usage information
                const usage = res.usage

                results[alias] = {
                    model: resolved,
                    status: "success",
                    duration,
                    usage: {
                        completionTokens: usage?.completion || 0,
                        promptTokens: usage?.prompt || 0,
                        totalTokens: usage?.total || 0,
                        cost: usage?.cost,
                    },
                    response: res.text?.trim()?.substring(0, 50) || "",
                }
                logInfo(
                    `  ✅ Success: ${resolved} (${usage?.total || 0} tokens, ${duration}ms)`
                )
            }
        } catch (error) {
            results[alias] = {
                error: error instanceof Error ? error.message : String(error),
                status: "failed",
            }
            logWarn(`  ❌ Failed: ${error}`)
        }

        logVerbose("")
    }

    // Print summary
    logInfo("\n=== Model Alias Check Summary ===")
    console.log(YAMLStringify(results))

    const successful = Object.keys(results).filter(
        (key) => (results as any)[key].status === "success"
    ).length
    const failed = allAliases.length - successful

    logInfo(`\n✅ Successful: ${successful}`)
    if (failed > 0) {
        logWarn(`❌ Failed: ${failed}`)
    }
}