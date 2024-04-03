import * as vscode from "vscode"
import { checkFileExists, readFileText, writeFile } from "./fs"

export async function setupDotEnv(projectUri: vscode.Uri): Promise<string> {
    // update .gitignore file
    if (!(await checkFileExists(projectUri, ".gitignore")))
        await writeFile(projectUri, ".gitignore", ".env\n")
    else {
        const content = await readFileText(projectUri, ".gitignore")
        if (!content.includes(".env"))
            await writeFile(projectUri, ".gitignore", content + "\n.env\n")
    }

    // update .env
    const uri = vscode.Uri.joinPath(projectUri, ".env")
    if (!(await checkFileExists(uri)))
        await writeFile(
            projectUri,
            ".env",
            `# GenAIScript configuration (https://microsoft.github.io/genaiscript/reference/token/)
OPENAI_API_KEY="<your token>"
`
        )

    const doc = await vscode.workspace.openTextDocument(uri)
    await vscode.window.showTextDocument(doc)
    const text = doc.getText()
    let nextText = text
    if (!/OPENAI_API_KEY/.test(text))
        nextText += `\nOPENAI_API_KEY="<your token>"`
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
