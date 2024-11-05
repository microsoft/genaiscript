---
title: GitHub
description: Support for querying GitHub
sidebar:
    order: 50
---

The `github` module provides several helper functions to query GitHub, along with the connection information for more advanced usage.

## Configuration

The `github` configuration is automatically detected from the environment and git.

- The GitHub token is read from the `GITHUB_TOKEN` environment variable. Some queries might work without authentication for public repositories.

### GitHub CodeSpaces

In a GitHub CodeSpace, the `GITHUB_TOKEN` is automatically provisioned.

### GitHub Actions

In GitHub Actions, you might need to add permissions to the workspace to access workflow logs and pull requests. Additionally, you need to pass the `secret.GITHUB_TOKEN` to the GenAIScript script run.

```yml title="genai.yml" 'actions: read' 'GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}'
permissions:
    contents: read
    actions: read
    pull-requests: read # or write if you plan to create comments
...
    - run: npx --yes genaiscript ...
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ...
```

## Functions

### Issues

You can query issues and issue comments using `listIssues` and `listIssueComments`.

```js
const issues = await github.listIssues({ per_page: 5 })
console.log(issues.map((i) => i.title))

// Use issue number!
const issueComments = await github.listIssueComments(issues[0].number)
console.log(issueComments)
```

### Pull Requests

Query pull requests and pull request review comments using `listPullRequests` and `listPullRequestReviewComments`.

```js
const prs = await github.listPullRequests({ per_page: 5 })
console.log(prs.map((i) => i.title))

// Use pull request number!
const prcs = await github.listPullRequestReviewComments(prs[0].number)
console.log(prcs.map((i) => i.body))
```

In GitHub Actions, ensure the `pull-request: read` permission is granted.

### Workflow Runs

Access the log of workflow runs to analyze failures with `listWorkflowRuns`.

```js
// List runs
const runs = await github.listWorkflowRuns("build.yml", { per_page: 5 })
console.log(runs.map((i) => i.status))

const jobs = await github.listWorkflowJobs(runs[0].id)
// Redacted job log
console.log(jobs[0].content)
```

In GitHub Actions, grant the `actions: read` permission.

### Search Code

Use `searchCode` for a code search on the default branch in the same repository.

```js
const res = await github.searchCode("HTMLToText")
console.log(res)
```

### Get File Content

Retrieve file content for a given ref, tag, or commit SHA using `getFile`.

```js
const pkg = await github.getFile("package.json", "main")
console.log(pkg.content.slice(0, 50) + "...")
```

### Get Repository Content

List files or directories at a path in a remote repository. By default, file contents from a directory are not loaded. Use `downloadContent: true`.

```js
// Get top-level markdown files
const files = await github.getRepositoryContent("", {
    type: "file",
    glob: "*.md",
    downloadContent: true,
    maxDownloadSize: 2_000,
})
```

### Languages

Query the list of programming languages that GitHub computed for the repository using `listRepositoryLanguages`.

```js
const languages = await github.listRepositoryLanguages()
```

### Branches

List the branches on the repository using `listBranches`.

```js
const branches = await github.listBranches()
console.log(branches)
```

## Advanced Use

Utilize [octokit](https://www.npmjs.com/package/octokit) to access the full GitHub APIs.

```js
import { Octokit } from "@octokit/core"

const client: Octokit = await github.client()
...
```

Install octokit in your list of packages:

```sh
npm install -D octokit
```
