import {
    SarifBuilder,
    SarifRunBuilder,
    SarifResultBuilder,
    SarifRuleBuilder,
} from "node-sarif-builder"
import { relative } from "node:path"
import {
    SARIFF_BUILDER_TOOL_DRIVER_NAME,
    SARIFF_BUILDER_URL,
    SARIFF_RULEID_PREFIX,
} from "../../core/src/constants"
import { CORE_VERSION } from "../../core/src/version"

/**
 * This module contains utility functions for working with SARIF (Static Analysis Results Interchange Format)
 * including checking file extensions and converting diagnostic issues to SARIF format.
 */

/**
 * Checks if the filename has a SARIF extension.
 * @param f - The filename to check.
 * @returns True if the filename ends with .sarif, false otherwise.
 */
export function isSARIFFilename(f: string) {
    return /\.sarif$/i.test(f)
}

/**
 * Converts diagnostic issues to a SARIF format.
 *
 * This function is intended to be used with the MS-SarifVSCode.sarif-viewer.
 *
 * @param template - The template containing script metadata, including id, title, and description.
 * @param issues - Array of diagnostic issues to convert.
 * @returns A stringified SARIF JSON object representing the diagnostic issues.
 */
export function convertDiagnosticsToSARIF(
    template: PromptScript,
    issues: Diagnostic[]
) {
    // Initialize a SARIF run with tool driver information
    const sarifRunBuilder = new SarifRunBuilder().initSimple({
        toolDriverName: SARIFF_BUILDER_TOOL_DRIVER_NAME,
        toolDriverVersion: CORE_VERSION,
        url: SARIFF_BUILDER_URL,
    })

    // Initialize a SARIF rule based on the provided template
    const sarifRuleBuiler = new SarifRuleBuilder().initSimple({
        ruleId: SARIFF_RULEID_PREFIX + template.id, // Unique rule identifier
        shortDescriptionText: template.title, // Short description for the rule
        fullDescriptionText: template.description, // Full description for the rule
    })
    sarifRunBuilder.addRule(sarifRuleBuiler)

    // Convert each diagnostic issue to a SARIF result
    for (const issue of issues) {
        const sarifResultBuilder = new SarifResultBuilder()
        sarifResultBuilder.initSimple({
            level: issue.severity === "info" ? "note" : issue.severity, // Map severity to SARIF level
            messageText: issue.message, // The message associated with the issue
            ruleId: template.id, // The rule ID associated with the issue
            fileUri: relative(process.cwd(), issue.filename).replace(
                /\\/g,
                "/"
            ), // Convert file path to a relative URI
            startLine: issue.range[0][0] + 1 || undefined, // Start line of the issue
            endLine: issue.range[1][0] + 1 || undefined, // End line of the issue
        })
        sarifRunBuilder.addResult(sarifResultBuilder)
    }

    // Build the final SARIF JSON string with indentation
    const sarifBuilder = new SarifBuilder()
    sarifBuilder.addRun(sarifRunBuilder)
    const sarifJsonString = sarifBuilder.buildSarifJsonString({ indent: true }) // indent:true for readability
    return sarifJsonString
}
