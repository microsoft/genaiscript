import { createFetch, tryReadText } from "./fetch";
import { generatedByFooter, mergeDescription } from "./githubclient";
import { prettifyMarkdown } from "./markdown";
import { logError, logVerbose } from "./util";
import { genaiscriptDebug } from "./debug";
const dbg = genaiscriptDebug("azuredevops");

// https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-requests/update?view=azure-devops-rest-7.1
export interface AzureDevOpsEnv {
  fork: boolean;
  accessToken: string;
  collectionUri: string;
  teamProject: string;
  repositoryId: string;
  apiVersion: string;
  sourceBranch: string;
  runUrl?: string;
}

/**
 * Parses Azure DevOps environment variables into a structured object.
 *
 * @param env - A record of environment variables.
 * @returns A structured object containing Azure DevOps environment details.
 *
 * Environment variables:
 * - SYSTEM_PULLREQUEST_ISFORK: Indicates if the pull request is from a fork.
 * - SYSTEM_ACCESSTOKEN: Authentication token for API requests.
 * - SYSTEM_COLLECTIONURI: The base URI of the Azure DevOps collection.
 * - SYSTEM_TEAMPROJECT: The name of the team project.
 * - BUILD_REPOSITORY_NAME: The name of the repository.
 * - BUILD_SOURCEBRANCH: The source branch for the build.
 * - apiVersion: The API version used for Azure DevOps requests.
 */
export async function azureDevOpsParseEnv(env: Record<string, string>): Promise<AzureDevOpsEnv> {
  const fork = env.SYSTEM_PULLREQUEST_ISFORK !== "False";
  const accessToken = env.SYSTEM_ACCESSTOKEN;
  const collectionUri = env.SYSTEM_COLLECTIONURI; // https://dev.azure.com/msresearch/
  const teamProject = env.SYSTEM_TEAMPROJECT;
  const repositoryId = env.BUILD_REPOSITORY_NAME; // build_repositoryid is a guid
  const sourceBranch = env.BUILD_SOURCEBRANCH;
  const apiVersion = "7.1";

  return {
    fork,
    accessToken,
    collectionUri,
    teamProject,
    repositoryId,
    apiVersion,
    sourceBranch,
  };
}

async function findPullRequest(info: AzureDevOpsEnv) {
  const { accessToken, collectionUri, sourceBranch, teamProject, repositoryId, apiVersion } = info;

  // query pull request
  const Authorization = `Bearer ${accessToken}`;
  const searchUrl = `${collectionUri}${teamProject}/_apis/git/pullrequests/?searchCriteria.repositoryId=${repositoryId}&searchCriteria.sourceRefName=${sourceBranch}&api-version=${apiVersion}`;
  const fetch = await createFetch({ retryOn: [] });
  const resGet = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Authorization,
    },
  });
  if (resGet.status !== 200) {
    logError(`pull request search failed, ${resGet.status}: ${resGet.statusText}`);
    return undefined;
  }
  const resGetJson = (await resGet.json()) as {
    value: {
      pullRequestId: number;
      description: string;
    }[];
  };
  const pr = resGetJson?.value?.[0];
  if (!pr) {
    logError(`pull request not found`);
    return undefined;
  }
  return pr;
}

/**
 * Updates the description of a pull request in Azure DevOps.
 *
 * @param script - The script object used to include a generated-by footer.
 * @param info - An object containing Azure DevOps environment details, such as tokens, URIs, and repository information.
 * @param text - The new content to include in the pull request description.
 * @param commentTag - A unique tag used to identify and merge specific content into the description.
 *
 * Merges the existing description with the provided text, appending a footer. Sends a PATCH request
 * to update the pull request description in Azure DevOps. Logs errors if the operation fails.
 */
export async function azureDevOpsUpdatePullRequestDescription(
  script: PromptScript,
  info: AzureDevOpsEnv,
  text: string,
  commentTag: string,
) {
  const { accessToken, collectionUri, teamProject, repositoryId, apiVersion } = info;

  // query pull request
  const pr = await findPullRequest(info);
  if (!pr) return;
  let { pullRequestId, description } = pr;

  text = prettifyMarkdown(text);
  text += generatedByFooter(script, info);
  description = mergeDescription(commentTag, description, text);

  const url = `${collectionUri}${teamProject}/_apis/git/repositories/${repositoryId}/pullrequests/${pullRequestId}?api-version=${apiVersion}`;
  const fetch = await createFetch({ retryOn: [] });
  const res = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify({ description }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status !== 200) logError(`pull request update failed, ${res.status}: ${res.statusText}`);
  else logVerbose(`pull request updated`);
}

/**
 * Creates a new issue comment on an Azure DevOps pull request.
 *
 * @param script - The script context providing metadata for execution.
 * @param info - Object containing Azure DevOps environment details such as API credentials and repository information.
 * @param body - The content of the comment to be added to the pull request.
 * @param commentTag - A unique tag used to identify and manage comments created by the script.
 *
 * If a comment with the same tag already exists in an open thread, it will be closed before creating the new comment.
 * Retrieves the relevant pull request, appends a footer to the comment body, and creates a new comment thread.
 */
export async function azureDevOpsCreateIssueComment(
  script: PromptScript,
  info: AzureDevOpsEnv,
  body: string,
  commentTag: string,
) {
  const { apiVersion, accessToken, collectionUri, teamProject, repositoryId } = info;

  const { pullRequestId } = (await findPullRequest(info)) || {};
  if (isNaN(pullRequestId)) return;

  const fetch = await createFetch({ retryOn: [] });
  body += generatedByFooter(script, info);

  const Authorization = `Bearer ${accessToken}`;
  const urlThreads = `${collectionUri}${teamProject}/_apis/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`;
  const url = `${urlThreads}?api-version=${apiVersion}`;
  if (commentTag) {
    const tag = `<!-- genaiscript ${commentTag} -->`;
    body = `${body}\n\n${tag}\n\n`;
    // https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-threads/list?view=azure-devops-rest-7.1&tabs=HTTP
    // GET https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/pullRequests/{pullRequestId}/threads?api-version=7.1-preview.1
    const resThreads = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization,
      },
    });
    if (resThreads.status !== 200) return;
    const threads = (await resThreads.json()) as {
      value: {
        id: string;
        status: string;
        comments: { content: string }[];
      }[];
    };
    const openThreads =
      threads.value?.filter(
        (c) => c.status === "active" && c.comments?.some((c) => c.content.includes(tag)),
      ) || [];
    for (const thread of openThreads) {
      logVerbose(`pull request closing old comment thread ${thread.id}`);
      await fetch(`${urlThreads}/${thread.id}?api-version=${apiVersion}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "closed",
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization,
        },
      });
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
  });
  if (res.status !== 200) {
    logError(`pull request comment creation failed, ${res.statusText}`);
    dbg(await tryReadText(res));
  } else logVerbose(`pull request comment created`);
}
