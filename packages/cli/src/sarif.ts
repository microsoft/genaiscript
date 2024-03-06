import { TOOL_ID, CORE_VERSION } from "genaiscript-core"
import {
    SarifBuilder,
    SarifRunBuilder,
    SarifResultBuilder,
    SarifRuleBuilder,
} from "node-sarif-builder"
import { relative } from "node:path"

export function isSARIFFilename(f: string) {
    return /\.sarif$/i.test(f)
}

// use with MS-SarifVSCode.sarif-viewer
export function convertDiagnosticsToSARIF(
    template: PromptTemplate,
    issues: Diagnostic[]
) {
    const sarifRunBuilder = new SarifRunBuilder().initSimple({
        toolDriverName: TOOL_ID,
        toolDriverVersion: CORE_VERSION,
        url: "https://github.com/microsoft/genaiscript/",
    })
    const sarifRuleBuiler = new SarifRuleBuilder().initSimple({
        ruleId: template.id,
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
