import { createFetch } from "./fetch"
import { generatedByFooter, mergeDescription } from "./github"
import { prettifyMarkdown } from "./markdown"
import { logError, logVerbose, trimTrailingSlash } from "./util"
import { YAMLStringify } from "./yaml"

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


//
export async function azureDevOpsCreateIssueComment(
    script: PromptScript,
    info: AzureDevOpsEnv,
    body: string,
    commentTag: string
): Promise<{ created: boolean; statusText: string; html_url?: string }> {
    const { apiUrl, repository, issue } = info

    if (!issue) return { created: false, statusText: "missing issue number" }
    const token = await host.readSecret(GITHUB_TOKEN)
    if (!token) return { created: false, statusText: "missing github token" }

    const fetch = await createFetch({ retryOn: [] })
    const url = `${apiUrl}/repos/${repository}/issues/${issue}/comments`

    body += generatedByFooter(script, info)

    if (commentTag) {
        const tag = `<!-- genaiscript ${commentTag} -->`
        body = `${body}\n\n${tag}\n\n`
        // try to find the existing comment
        const resListComments = await fetch(
            `${url}?per_page=100&sort=updated`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${token}`,
                    "X-GitHub-Api-Version": GITHUB_API_VERSION,
                },
            }
        )
        if (resListComments.status !== 200)
            return { created: false, statusText: resListComments.statusText }
        const comments = (await resListComments.json()) as {
            id: string
            body: string
        }[]
        const comment = comments.find((c) => c.body.includes(tag))
        if (comment) {
            const delurl = `${apiUrl}/repos/${repository}/issues/comments/${comment.id}`
            const resd = await fetch(delurl, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-GitHub-Api-Version": GITHUB_API_VERSION,
                },
            })
            if (!resd.ok)
                logError(`issue comment delete failed, ` + resd.statusText)
        }
    }

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
        body: JSON.stringify({ body }),
    })
    const resp: { id: string; html_url: string } = await res.json()
    const r = {
        created: res.status === 201,
        statusText: res.statusText,
        html_url: resp.html_url,
    }
    if (!r.created)
        logError(
            `pull request ${issue} comment creation failed, ${r.statusText}`
        )
    else logVerbose(`pull request ${issue} comment created at ${r.html_url}`)

    return r
}
