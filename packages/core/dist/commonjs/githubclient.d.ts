import type { Octokit } from "@octokit/rest";
import type { PaginateInterface } from "@octokit/plugin-paginate-rest";
import { CancellationOptions } from "./cancellation.js";
import { TraceOptions } from "./trace.js";
export interface GithubConnectionInfo {
  token: string;
  apiUrl?: string;
  repository: string;
  owner: string;
  repo: string;
  ref?: string;
  refName?: string;
  sha?: string;
  issue?: number;
  runId?: string;
  runUrl?: string;
  commitSha?: string;
}
/**
 * Parses GitHub environment variables to construct connection info for API usage.
 *
 * @param env - Environment variables to parse, typically `process.env`.
 * @param options - Optional parameters:
 *   - issue: The issue number to set explicitly.
 *   - resolveIssue: Flag to resolve issue number via the GitHub CLI if not provided.
 *   - owner: Repository owner to override environment variables.
 *   - repo: Repository name to override environment variables.
 * @returns A promise resolving to an object containing parsed GitHub connection information, including owner, repo, repository, issue, and token details.
 *
 * Notes:
 * - If owner, repo, or repository details are missing, attempts to resolve them using the GitHub CLI.
 * - If issue resolution is enabled and not provided, tries to determine the pull request number via the GitHub CLI.
 * - Handles errors gracefully by logging verbose error messages but does not throw.
 */
export declare function githubParseEnv(
  env: Record<string, string>,
  options?: {
    issue?: number;
    resolveToken?: boolean;
    resolveIssue?: boolean;
    resolveCommit?: boolean;
  } & Partial<Pick<GithubConnectionInfo, "owner" | "repo">> &
    TraceOptions &
    CancellationOptions,
): Promise<GithubConnectionInfo>;
/**
 * Updates the description of a pull request on GitHub.
 * Parameters:
 * - script: The script instance used to generate the footer.
 * - info: Object containing apiUrl, repository, issue, and runUrl. The issue field must be provided.
 * - text: The new description text to update. It will be prettified, merged with the existing description, and appended with a footer.
 * - commentTag: Tag used to identify and merge the description. Must be provided.
 * Returns:
 * - An object indicating whether the update was successful and the status text.
 * Notes:
 * - Requires a valid GitHub token to authenticate API requests.
 * - If the issue number is missing, the update will not proceed.
 */
export declare function githubUpdatePullRequestDescription(
  script: PromptScript,
  info: GithubConnectionInfo,
  text: string,
  commentTag: string,
  options?: CancellationOptions,
): Promise<{
  updated: boolean;
  statusText: string;
}>;
/**
 * Merges a new comment or text segment into the existing body, enclosed
 * within the specified comment tags. If tags exist, updates the content
 * between them; otherwise, appends the entire section.
 *
 * @param commentTag - The unique identifier tag used to demarcate the section
 *                     in the body where merging occurs.
 * @param body - The existing text or content to be updated.
 * @param text - The new content to merge into the body.
 * @returns Updated body text with merged and formatted content.
 */
export declare function mergeDescription(commentTag: string, body: string, text: string): string;
/**
 * Generates a footer indicating the content was AI-generated.
 *
 * @param script - The script instance responsible for generating the content.
 * @param info - An object containing metadata, such as the URL to the workflow run.
 *   - runUrl - Optional URL to the current workflow or run.
 * @param code - Optional identifier code to be appended to the footer.
 * @returns A formatted string serving as a footer, warning readers about the AI-generated content.
 */
export declare function generatedByFooter(
  script: PromptScript,
  info: {
    runUrl?: string;
  },
  code?: string,
): string;
/**
 * Appends an AI-generated comment with diagnostic details to a script.
 *
 * @param script - The script instance where the comment will be appended.
 * @param info - Contains contextual information such as the run URL for generating the footer link.
 *   - runUrl - The URL of the workflow or job run, if available.
 * @param annotation - The diagnostic information to include in the comment.
 *   - message - The diagnostic message to be displayed.
 *   - code - An optional code identifier related to the diagnostic.
 *   - severity - The level of severity (e.g., warning or error) for the diagnostic.
 * @returns A formatted Markdown string representing the AI-generated comment with a footer and diagnostic details.
 */
export declare function appendGeneratedComment(
  script: PromptScript,
  info: {
    runUrl?: string;
    owner: string;
    repo: string;
  },
  annotation: Diagnostic,
): string;
export declare function githubCreateIssueComment(
  script: PromptScript,
  info: GithubConnectionInfo,
  body: string,
  commentTag: string,
  options?: CancellationOptions,
): Promise<{
  created: boolean;
  statusText: string;
  html_url?: string;
}>;
/**
 * Creates pull request review comments on GitHub for a set of code annotations.
 *
 * @param script - The script instance generating the comments.
 * @param info - Connection details for GitHub, including API URL, repository, pull request issue number, run URL, and commit SHA.
 * @param annotations - List of diagnostics or annotations to provide as review comments on the pull request.
 * @returns A promise resolving to a boolean indicating whether all review comments were successfully created.
 *
 * Notes:
 * - If no annotations are provided, the function skips creating reviews and resolves to true.
 * - If the issue number or commit SHA is missing, the function logs an error and resolves to false.
 * - Retrieves an authentication token from the secrets store to authenticate API requests.
 * - Fetches existing pull request comments to avoid duplication when creating review comments.
 */
export declare function githubCreatePullRequestReviews(
  script: PromptScript,
  info: GithubConnectionInfo,
  annotations: Diagnostic[],
  options?: CancellationOptions,
): Promise<boolean>;
export declare class GitHubClient implements GitHub {
  private readonly _info;
  private _connection;
  private _client;
  private static _default;
  static default(): GitHubClient;
  constructor(info: Pick<GithubConnectionInfo, "owner" | "repo">);
  private connection;
  client(owner: string, repo: string): GitHubClient;
  api(): Promise<
    {
      client: Octokit & {
        paginate: PaginateInterface;
      };
    } & GithubConnectionInfo
  >;
  info(): Promise<GitHubOptions>;
  repo(): Promise<{
    name: string;
    full_name: string;
    default_branch: string;
  }>;
  getRef(branchName: string): Promise<GitHubRef>;
  getOrCreateRef(
    branchName: string,
    options?: {
      base?: string;
      orphaned?: boolean | string;
    },
  ): Promise<GitHubRef>;
  uploadAsset(
    file: BufferLike,
    options?: {
      branchName?: string;
    },
  ): Promise<string>;
  listIssues(
    options?: {
      state?: "open" | "closed" | "all";
      labels?: string;
      sort?: "created" | "updated" | "comments";
      direction?: "asc" | "desc";
      creator?: string;
      assignee?: string;
      since?: string;
      mentioned?: string;
    } & GitHubPaginationOptions,
  ): Promise<GitHubIssue[]>;
  listGists(
    options?: {
      since?: string;
      filenameAsResources?: boolean;
    } & GitHubPaginationOptions,
  ): Promise<GitHubGist[]>;
  getGist(gist_id?: string): Promise<GitHubGist | undefined>;
  getIssue(issue_number?: number | string): Promise<GitHubIssue>;
  updateIssue(
    issueNumber: number | string,
    options?: GitHubIssueUpdateOptions,
  ): Promise<GitHubIssue>;
  createIssueComment(issue_number: number | string, body: string): Promise<GitHubComment>;
  updateIssueComment(
    comment_id: number | string,
    body: string,
  ): Promise<{
    id: number;
    node_id: string;
    url: string;
    body?: string;
    body_text?: string;
    body_html?: string;
    html_url: string;
    user: {
      name?: string | null;
      email?: string | null;
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string | null;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
      starred_at?: string;
      user_view_type?: string;
    };
    created_at: string;
    updated_at: string;
    issue_url: string;
    author_association:
      | "COLLABORATOR"
      | "CONTRIBUTOR"
      | "FIRST_TIMER"
      | "FIRST_TIME_CONTRIBUTOR"
      | "MANNEQUIN"
      | "MEMBER"
      | "NONE"
      | "OWNER";
    performed_via_github_app?: {
      id: number;
      slug?: string;
      node_id: string;
      client_id?: string;
      owner:
        | {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
          }
        | {
            description?: string | null;
            html_url: string;
            website_url?: string | null;
            id: number;
            node_id: string;
            name: string;
            slug: string;
            created_at: string | null;
            updated_at: string | null;
            avatar_url: string;
          };
      name: string;
      description: string | null;
      external_url: string;
      html_url: string;
      created_at: string;
      updated_at: string;
      permissions: {
        issues?: string;
        checks?: string;
        metadata?: string;
        contents?: string;
        deployments?: string;
        [key: string]: string | undefined;
      };
      events: string[];
      installations_count?: number;
      client_secret?: string;
      webhook_secret?: string | null;
      pem?: string;
    };
    reactions?: {
      url: string;
      total_count: number;
      "+1": number;
      "-1": number;
      laugh: number;
      confused: number;
      heart: number;
      hooray: number;
      eyes: number;
      rocket: number;
    };
  }>;
  listPullRequests(
    options?: {
      state?: "open" | "closed" | "all";
      sort?: "created" | "updated" | "popularity" | "long-running";
      direction?: "asc" | "desc";
    } & GitHubPaginationOptions,
  ): Promise<GitHubPullRequest[]>;
  getPullRequest(pull_number?: number | string): Promise<GitHubPullRequest>;
  listPullRequestReviewComments(
    pull_number: number,
    options?: GitHubPaginationOptions,
  ): Promise<GitHubComment[]>;
  listIssueComments(
    issue_number: number,
    options?: {
      reactions?: boolean;
    } & GitHubPaginationOptions,
  ): Promise<GitHubComment[]>;
  listReleases(options?: GitHubPaginationOptions): Promise<GitHubRelease[]>;
  workflowRun(runId: number | string): Promise<GitHubWorkflowRun>;
  listWorkflowRuns(
    workflowIdOrFilename: string | number,
    options?: {
      branch?: string;
      status?: GitHubWorkflowRunStatus;
    } & GitHubPaginationOptions,
  ): Promise<GitHubWorkflowRun[]>;
  /**
   * List artifacts for a given workflow run
   * @param runId
   */
  listWorkflowRunArtifacts(
    runId: number | string,
    options?: GitHubPaginationOptions,
  ): Promise<GitHubArtifact[]>;
  /**
   * Gets the files of a GitHub Action workflow run artifact
   * @param artifactId
   */
  artifact(artifactId: number | string): Promise<GitHubArtifact>;
  resolveAssetUrl(url: string): Promise<string>;
  downloadArtifactFiles(artifactId: number | string): Promise<WorkspaceFile[]>;
  listWorkflowJobs(
    run_id: number,
    options?: {
      filter?: "all" | "latest";
    } & GitHubPaginationOptions,
  ): Promise<GitHubWorkflowJob[]>;
  /**
   * Downloads a GitHub Action workflow run log
   * @param jobId
   */
  downloadWorkflowJobLog(
    job_id: number,
    options?: {
      llmify?: boolean;
    },
  ): Promise<string>;
  private downloadJob;
  diffWorkflowJobLogs(job_id: number, other_job_id: number): Promise<string>;
  getFile(filename: string, ref: string): Promise<WorkspaceFile>;
  searchCode(query: string, options?: GitHubPaginationOptions): Promise<GitHubCodeSearchResult[]>;
  workflow(workflowId: number | string): Promise<GitHubWorkflow>;
  listWorkflows(options?: GitHubPaginationOptions): Promise<GitHubWorkflow[]>;
  listBranches(options?: GitHubPaginationOptions): Promise<string[]>;
  listRepositoryLanguages(): Promise<Record<string, number>>;
  listIssueLabels(issueNumber?: string | number): Promise<GitHubLabel[]>;
  getRepositoryContent(
    path: string,
    options?: {
      ref?: string;
      glob?: string;
      downloadContent?: boolean;
      maxDownloadSize?: number;
      type?: string;
    },
  ): Promise<GitHubFile[]>;
}
export declare function cleanLog(text: string): string;
//# sourceMappingURL=githubclient.d.ts.map
