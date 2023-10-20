import * as vscode from "vscode"
import { JSON5TryParse } from "./json5"

export async function saveAllTextDocuments() {
    await Promise.all(
        vscode.workspace.textDocuments
            .filter((doc) => doc.isDirty)
            .map((doc) => doc.save())
    )
}

export async function checkFileExists(
    folderOrFile: vscode.Uri,
    filePath?: string
): Promise<boolean> {
    try {
        const file = filePath
            ? vscode.Uri.joinPath(folderOrFile, filePath)
            : folderOrFile
        await vscode.workspace.fs.stat(file)
        return true
    } catch (error) {
        return false
    }
}

export async function writeFile(
    folder: vscode.Uri,
    fileName: string,
    fileContent: string,
    options?: { open?: boolean; column?: vscode.ViewColumn }
): Promise<vscode.Uri> {
    const file = vscode.Uri.joinPath(folder, fileName)
    await vscode.workspace.fs.writeFile(
        file,
        new TextEncoder().encode(fileContent)
    )
    if (options?.open) await openFileEditor(folder, fileName, options?.column)
    return file
}

export async function openFileEditor(
    folder: vscode.Uri,
    fileName: string,
    column?: vscode.ViewColumn
) {
    const file = vscode.Uri.joinPath(folder, fileName)
    const document = await vscode.workspace.openTextDocument(file)
    await vscode.window.showTextDocument(document, column)
}

export async function readFileText(
    folderOrFile: vscode.Uri,
    filePath?: string
): Promise<string | undefined> {
    if (!(await checkFileExists(folderOrFile, filePath))) return undefined

    const file = filePath
        ? vscode.Uri.joinPath(folderOrFile, filePath)
        : folderOrFile
    const buffer = await vscode.workspace.fs.readFile(file)
    return new TextDecoder().decode(buffer)
}

export async function readFileJSON<T>(
    folder: vscode.Uri,
    filePath?: string
): Promise<T | undefined | null> {
    const src = await readFileText(folder, filePath)
    try {
        return JSON5TryParse(src)
    } catch (e) {
        return undefined
    }
}
