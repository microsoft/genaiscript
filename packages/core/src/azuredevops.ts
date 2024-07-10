import { createFetch } from "./fetch"
import { generatedByFooter, mergeDescription } from "./github"
import { prettifyMarkdown } from "./markdown"
import { logError, logVerbose, trimTrailingSlash } from "./util"

// https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-requests/update?view=azure-devops-rest-6.0

export interface AzureDevOpsEnv {
    fork: boolean
    accessToken: string
    collectionUri: string
    teamProject: string
    repositoryId: string
    apiVersion: string
    sourceBranch: string
    runUrl?: string
}

// https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml
export function azureDevOpsParseEnv(
    env: Record<string, string>
): AzureDevOpsEnv {
    const fork = env.SYSTEM_PULLREQUEST_ISFORK !== "False"
    const accessToken = env.SYSTEM_ACCESSTOKEN
    const collectionUri = env.SYSTEM_COLLECTIONURI // https://dev.azure.com/msresearch/
    const teamProject = env.SYSTEM_TEAMPROJECT
    const repositoryId = env.BUILD_REPOSITORY_NAME // build_repositoryid is a guid
    const sourceBranch = env.BUILD_SOURCEBRANCH
    const apiVersion = "7.1"

    return {
        fork,
        accessToken,
        collectionUri,
        teamProject,
        repositoryId,
        apiVersion,
        sourceBranch,
    }
}

export async function azureDevOpsUpdatePullRequestDescription(
    script: PromptScript,
    info: AzureDevOpsEnv,
    text: string,
    commentTag: string
) {
    const {
        accessToken,
        collectionUri,
        sourceBranch,
        teamProject,
        repositoryId,
        apiVersion,
    } = info

    text = prettifyMarkdown(text)
    text += generatedByFooter(script, info)

    const fetch = await createFetch({ retryOn: [] })

    // query pull request
    const searchUrl = `${collectionUri}${teamProject}/_apis/git/pullrequests/?searchCriteria.repositoryId=${repositoryId}&searchCriteria.sourceRefName=${sourceBranch}&api-version=${apiVersion}`
    const resGet = await fetch(searchUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    })
    if (resGet.status !== 200) {
        logError(
            `pull request search failed, ${resGet.status}: ${resGet.statusText}`
        )
        return
    }
    const resGetJson = (await resGet.json()) as {
        pullRequestId: number
        description: string
    }[]
    let { pullRequestId, description } = resGetJson?.[0] || {}
    if (isNaN(pullRequestId)) {
        logError(`pull request not found`)
        return
    }
    description = mergeDescription(commentTag, description, text)
    const url = `${collectionUri}${teamProject}/_apis/git/repositories/${repositoryId}/pullRequests/${pullRequestId}?api-version=${apiVersion}`
    const res = await fetch(url, {
        method: "PATCH",
        body: JSON.stringify({ description }),
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    })
    if (res.status !== 200)
        logError(`pull request update failed, ${res.status}: ${res.statusText}`)
    else logVerbose(`pull request updated`)
}
