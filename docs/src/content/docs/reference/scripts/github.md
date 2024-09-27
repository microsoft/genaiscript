---
title: GitHub
description: Support for querying GitHub
sidebar:
    order: 50
---

The `github` provides several helper function to query github. It also provides the connection information for more advanced usage.

## Configuration

The `github` configuration is automatically sniffed from the environment and git.

The GitHub token is read from the `GITHUB_TOKEN` environment variable. Some queries might work without authentication for public repositories.

### GitHub CodeSpaces

In a GitHub CodeSpace, the `GITHUB_TOKEN` is automatically provisioned.

### GitHub Actions

In GitHub Actions, you might will to add permissions to the
workspace to access workflow logs and pull requests. You also need to pass the `secret.GITHUB_TOKEN` to the genaiscript script run.

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

You can query issues and issue comments using `listIssues`, `listIssueComments`.

```js
const issues = await github.listIssues({ per_page: 5 })
console.log(issues.map((i) => i.title))

// use number!
const issueComments = await github.listIssueComments(issues[0].number)
console.log(issueComments)
```

### Pull Requests

You can query pull requests and pull request reviews comments using `listPullRequests`, `listPullRequestReviewComments`.

```js
const prs = await github.listPullRequests({ pre_page: 5 })
console.log(prs.map((i) => i.title))

// use number!
const prcs = await github.listPullRequestReviewComments(prs[0].number)
console.log(prcs.map((i) => i.body))
```

In GitHub Actions, you need to give the `pull-request: read` permission.

### Workflow runs

Access the log of workflow runs to analyze failures.

```js
// list runs
const runs = await github.listWorkflowRuns("build.yml", { per_page: 5 })
console.log(runs.map((i) => i.status))

const jobs = await github.listWorkflowJobs(runs[0].id)
// redacted job log
console.log(jobs[0].content)
```

In GitHub Actions, you need to give the `actions: read` permission.

### Search Code

Use `searchCode` for a code search on the default branch in the same repo.

```js
const res = await github.searchCode("HTMLToText")
console.log(res)
```

### Get file content

Gets the file content for a given ref, tag or commit sha.

```js
const pkg = await github.getFile("package.json", "main")
console.log(pkg.content.slice(0, 50) + "...")
```

## Advanced use

You can use [octokit](https://www.npmjs.com/package/octokit) to access the full GitHub APIs.

```js
import { Octokit } from "octokit"

const info = await github.info()
const client = new Octokit(info)
...
```

You will probably need to install it in your list of packages:

```sh
npm install -D octokit
```
