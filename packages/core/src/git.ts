import { runtimeHost } from "./host"

export class GitClient implements Git {
    async selectModifiedFiles(
        scope: "branch" | "staged" | "modified",
        options?: {
            endsWith?: ElementOrArray<string>
            glob?: ElementOrArray<string>
        }
    ): Promise<WorkspaceFile[]> {
        let args: string[] = []
        switch (scope) {
            case "branch": {
            }
            case "staged": {
                args = ["diff", "--cached", "--name-only", "--diff-filter=AM"]
                break
            }
            case "modified": {
                args = ["diff", "--name-only", "--diff-filter=AM"]
                break
            }
        }
        return undefined
    }
}
