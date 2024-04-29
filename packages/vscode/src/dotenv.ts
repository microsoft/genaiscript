import * as vscode from "vscode"
import { checkFileExists, readFileText, writeFile } from "./fs"
import { parseModelIdentifier } from "genaiscript-core"

export async function setupDotEnv(
    projectUri: vscode.Uri,
    modelId?: string
): Promise<string> {
    // update .gitignore file
    if (!(await checkFileExists(projectUri, ".gitignore")))
        await writeFile(projectUri, ".gitignore", ".env\n")
    else {
        const content = await readFileText(projectUri, ".gitignore")
        if (!content.includes(".env"))
            await writeFile(projectUri, ".gitignore", content + "\n.env\n")
    }

    const { provider } = parseModelIdentifier(modelId)
    const key = `${provider.toUpperCase()}_API_KEY`
    const keys = `
# GenAIScript configuration (https://microsoft.github.io/genaiscript/reference/token/)
${key}=<your token for ${provider}>
#${provider.toUpperCase()}_API_BASE=${provider} api url
`

    // update .env
    const uri = vscode.Uri.joinPath(projectUri, ".env")
    if (!(await checkFileExists(uri))) await writeFile(projectUri, ".env", keys)

    const doc = await vscode.workspace.openTextDocument(uri)
    await vscode.window.showTextDocument(doc)
    const text = doc.getText()
    let nextText = text
    if (!text.includes(key)) nextText += `\n${keys}`
    if (nextText !== text) {
        const edit = new vscode.WorkspaceEdit()
        edit.replace(
            uri,
            doc.validateRange(new vscode.Range(0, 0, 999, 999)),
            nextText
        )
        await vscode.workspace.applyEdit(edit)
    }
    return undefined
}
