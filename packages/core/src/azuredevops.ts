import { createFetch } from "./fetch"
import { generatedByFooter, mergeDescription } from "./github"
import { prettifyMarkdown } from "./markdown"
import { logError, logVerbose } from "./util"

// https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-requests/update?view=azure-devops-rest-6.0

export interface AzureDevOpsEnv {
    accessToken: string
    collectionUri: string
    repositoryId: string
    apiVersion: string
    pullRequestId: string
    runUrl: string
}

// https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml
export function azureDevOpsParseEnv(
    env: Record<string, string>
): AzureDevOpsEnv {
    const accessToken = env.SYSTEM_ACCESSTOKEN
    const collectionUri = env.SYSTEM_COLLECTIONURI
    const repositoryId = env.BUILD_REPOSITORY_ID
    const pullRequestId = env.SYSTEM_PULLREQUEST_PULLREQUESTID
    const apiVersion = "6.0"
    const runUrl = env.BUILD_BUILDURI

    return accessToken &&
        collectionUri &&
        repositoryId &&
        pullRequestId !== undefined
        ? {
              accessToken,
              collectionUri,
              repositoryId,
              apiVersion,
              pullRequestId,
              runUrl,
          }
        : undefined
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
        repositoryId,
        apiVersion,
        pullRequestId,
    } = info
    const url = `${collectionUri}/${repositoryId}/_apis/git/repositories/${repositoryId}/pullRequests/${pullRequestId}?api-version=${apiVersion}`

    text = prettifyMarkdown(text)
    text += generatedByFooter(script, info)

    const fetch = await createFetch({ retryOn: [] })
    const resGet = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    })
    const resGetJson = (await resGet.json()) as { description: string }
    const description = mergeDescription(
        commentTag,
        resGetJson.description,
        text
    )
    const res = await fetch(url, {
        method: "PATCH",
        body: JSON.stringify({ description }),
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    })
    const r = {
        updated: res.status === 200,
        statusText: res.statusText,
    }
    if (!r.updated) logError(`pull request update failed, ${r.statusText}`)
    else logVerbose(`pull request updated`)
}
