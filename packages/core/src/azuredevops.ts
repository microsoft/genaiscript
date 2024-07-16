import { createFetch } from "./fetch"
import { generatedByFooter, mergeDescription } from "./github"
import { prettifyMarkdown } from "./markdown"
import { logError, logVerbose, trimTrailingSlash } from "./util"

// https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-requests/update?view=azure-devops-rest-7.1
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

async function findPullRequest(info: AzureDevOpsEnv) {
    const {
        accessToken,
        collectionUri,
        sourceBranch,
        teamProject,
        repositoryId,
        apiVersion,
    } = info

    // query pull request
    const Authorization = `Bearer ${accessToken}`
    const searchUrl = `${collectionUri}${teamProject}/_apis/git/pullrequests/?searchCriteria.repositoryId=${repositoryId}&searchCriteria.sourceRefName=${sourceBranch}&api-version=${apiVersion}`
    const fetch = await createFetch({ retryOn: [] })
    const resGet = await fetch(searchUrl, {
        method: "GET",
        headers: {
            Authorization,
        },
    })
    if (resGet.status !== 200) {
        logError(
            `pull request search failed, ${resGet.status}: ${resGet.statusText}`
        )
        return undefined
    }
    const resGetJson = (await resGet.json()) as {
        value: {
            pullRequestId: number
            description: string
        }[]
    }
    const pr = resGetJson?.value?.[0]
    if (!pr) {
        logError(`pull request not found`)
        return undefined
    }
    return pr
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
        teamProject,
        repositoryId,
        apiVersion,
    } = info

    // query pull request
    const pr = await findPullRequest(info)
    if (!pr) return
    let { pullRequestId, description } = pr

    text = prettifyMarkdown(text)
    text += generatedByFooter(script, info)
    description = mergeDescription(commentTag, description, text)

    const url = `${collectionUri}${teamProject}/_apis/git/repositories/${repositoryId}/pullrequests/${pullRequestId}?api-version=${apiVersion}`
    const fetch = await createFetch({ retryOn: [] })
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

export async function azureDevOpsCreateIssueComment(
    script: PromptScript,
    info: AzureDevOpsEnv,
    body: string,
    commentTag: string
) {
    const {
        apiVersion,
        accessToken,
        collectionUri,
        teamProject,
        repositoryId,
    } = info

    const { pullRequestId } = (await findPullRequest(info)) || {}
    if (isNaN(pullRequestId)) return

    const fetch = await createFetch({ retryOn: [] })
    body += generatedByFooter(script, info)

    const Authorization = `Bearer ${accessToken}`
    const urlThreads = `${collectionUri}${teamProject}/_apis/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`
    const url = `${urlThreads}?api-version=${apiVersion}`
    if (commentTag) {
        const tag = `<!-- genaiscript ${commentTag} -->`
        body = `${body}\n\n${tag}\n\n`
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-threads/list?view=azure-devops-rest-7.1&tabs=HTTP
        // GET https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/pullRequests/{pullRequestId}/threads?api-version=7.1-preview.1
        const resThreads = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization,
            },
        })
        if (resThreads.status !== 200) return
        const threads = (await resThreads.json()) as {
            value: {
                id: string
                comments: { content: string }[]
            }[]
        }

        const thread = threads.value?.find((c) =>
            c.comments?.some((c) => c.content.includes(tag))
        )
        if (thread) {
            await fetch(
                `${urlThreads}/${thread.id}?api-version=${apiVersion}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: "closed",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization,
                    },
                }
            )
        }
    }

    // https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-threads/create?view=azure-devops-rest-7.1&tabs=HTTP
    // POST https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/pullRequests/{pullRequestId}/threads?api-version=7.1-preview.1
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization,
        },
        body: JSON.stringify({
            status: "active",
            comments: [
                {
                    content: body,
                    commentType: "text",
                },
            ],
        }),
    })
    if (res.status !== 200)
        logError(`pull request comment creation failed, ${res.statusText}`)
    logVerbose(`pull request comment created}`)
}
