import type { PromptScript } from "./types.js";
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
export declare function azureDevOpsParseEnv(env: Record<string, string>): Promise<AzureDevOpsEnv>;
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
export declare function azureDevOpsUpdatePullRequestDescription(script: PromptScript, info: AzureDevOpsEnv, text: string, commentTag: string): Promise<void>;
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
export declare function azureDevOpsCreateIssueComment(script: PromptScript, info: AzureDevOpsEnv, body: string, commentTag: string): Promise<void>;
//# sourceMappingURL=azuredevops.d.ts.map