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

export function isSARIFFilename(f: string) {
    return /\.sarif$/i.test(f)
}

// use with MS-SarifVSCode.sarif-viewer
export function convertDiagnosticsToSARIF(
    template: PromptScript,
    issues: Diagnostic[]
) {
    const sarifRunBuilder = new SarifRunBuilder().initSimple({
        toolDriverName: SARIFF_BUILDER_TOOL_DRIVER_NAME,
        toolDriverVersion: CORE_VERSION,
        url: SARIFF_BUILDER_URL,
    })
    const sarifRuleBuiler = new SarifRuleBuilder().initSimple({
        ruleId: SARIFF_RULEID_PREFIX + template.id,
        shortDescriptionText: template.title,
        fullDescriptionText: template.description,
    })
    sarifRunBuilder.addRule(sarifRuleBuiler)
    for (const issue of issues) {
        const sarifResultBuilder = new SarifResultBuilder()
        sarifResultBuilder.initSimple({
            level: issue.severity === "info" ? "note" : issue.severity,
            messageText: issue.message,
            ruleId: template.id,
            fileUri: relative(process.cwd(), issue.filename).replace(
                /\\/g,
                "/"
            ),
            startLine: issue.range[0][0] + 1 || undefined,
            endLine: issue.range[1][0] + 1 || undefined,
        })
        sarifRunBuilder.addResult(sarifResultBuilder)
    }
    const sarifBuilder = new SarifBuilder()
    sarifBuilder.addRun(sarifRunBuilder)
    const sarifJsonString = sarifBuilder.buildSarifJsonString({ indent: true }) // indent:true if you like
    return sarifJsonString
}
