import ignorer from "ignore"

export async function filterGitIgnore(gitignore: string, files: string[]) {
    if (gitignore) {
        const ig = ignorer().add(gitignore)
        files = ig.filter(files)
    }
    return files
}
