// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { GitHubClient } from "../src/githubclient.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isCI } from "../src/ci.js";
import { TestHost } from "./testhost.js";
import { tryResolveResource } from "../src/resources.js";

describe("GitHubClient", async () => {
  const client = GitHubClient.default();

  beforeEach(() => {
    TestHost.install();
  });

  test("info() returns GitHub options", async () => {
    const info = await client.info();
    assert(info.owner);
    assert(info.repo);
  });

  test("api() returns GitHub client", async () => {
    const api = await client.api();
    assert(api.client);
    assert(api.owner);
    assert(api.repo);
  });

  test("listIssues()", async () => {
    const issues = await client.listIssues({ count: 2 });
    assert(issues.length);
    const issue = await client.getIssue(issues[0].number);
    assert(issue?.number === issues[0].number);
    assert(issue?.title);
  });

  test("listGists()", async () => {
    const gists = await client.listGists({ count: 2 });
    assert(Array.isArray(gists));
    const gist = await client.getGist(gists[0].id);
    assert(gist?.files);
  });

  test("listPullRequests()", async () => {
    const prs = await client.listPullRequests({ count: 2 });
    assert(Array.isArray(prs));
    const pr = await client.getPullRequest(prs[0].number);
    assert(pr?.number === prs[0].number);
  });
  test("listWorkflowRuns()", async () => {
    if (isCI) return;
    const workflows = await client.listWorkflows({ count: 2 });
    assert(Array.isArray(workflows));
    const runs = await client.listWorkflowRuns(workflows[0].id);
    assert(Array.isArray(runs));
    const jobs = await client.listWorkflowJobs(runs[0].id);
    assert(Array.isArray(jobs));
    const log = await client.downloadWorkflowJobLog(jobs[0].id);
    assert(typeof log === "string");
    const artifacts = await client.listWorkflowRunArtifacts(runs[0].id);
    assert(Array.isArray(artifacts));
    if (artifacts.length) {
      const files = await client.downloadArtifactFiles(artifacts[0].id);
      assert(files.length);
    }
  });

  test("getFile() returns file content", async () => {
    const file = await client.getFile("README.md", "main");
    assert(file?.content);
  });
  test("searchCode() returns search results", async () => {
    if (isCI) return;
    const results = await client.searchCode("writeText");
    assert(Array.isArray(results));
  });

  test("listBranches() returns array of branches", async () => {
    const branches = await client.listBranches();
    assert(Array.isArray(branches));
  });

  test("listRepositoryLanguages() returns language stats", async () => {
    const langs = await client.listRepositoryLanguages();
    assert(typeof langs === "object");
  });

  test("getRepositoryContent() returns repository files", async () => {
    const files = await client.getRepositoryContent("packages/core/src");
    assert(Array.isArray(files));
  });
  test("getOrCreateRef()", async () => {
    const client = GitHubClient.default();
    const existingRef = await client.getOrCreateRef("test-ignore", {
      orphaned: true,
    });
    assert(existingRef);
    assert(existingRef.ref === "refs/heads/test-ignore");
  });
  test("uploadAsset()", async () => {
    if (isCI) return;
    const buffer = await readFile(fileURLToPath(import.meta.url));
    const client = GitHubClient.default();
    const url = await client.uploadAsset(buffer);
    assert(url);
    const parsedUrl = new URL(url);
    assert(parsedUrl.host === "raw.githubusercontent.com");

    // Test with undefined buffer
    const un = await client.uploadAsset(undefined);
    assert(un === undefined);
  });
  test("resolveAssetUrl -image", async () => {
    const resolved = await client.resolveAssetUrl(
      "https://github.com/user-attachments/assets/a6e1935a-868e-4cca-9531-ad0ccdb9eace",
    );
    assert(resolved);
    assert(resolved.includes("githubusercontent.com"));
  });
  test("resolveAssetUrl - mp4", async () => {
    const resolved = await client.resolveAssetUrl(
      "https://github.com/user-attachments/assets/f7881bef-931d-4f76-8f63-b4d12b1f021e",
    );
    console.log(resolved);
    assert(resolved.includes("githubusercontent.com"));
  });

  test("resolveAssetUrl - image - indirect", async () => {
    const resolved = await tryResolveResource(
      "https://github.com/user-attachments/assets/a6e1935a-868e-4cca-9531-ad0ccdb9eace",
    );
    assert(resolved.files[0].content);
    assert.strictEqual(resolved.files[0].type, "image/jpeg");
  });
  test("listLabels() returns array of labels", async () => {
    const labels = await client.listIssueLabels();
    assert(Array.isArray(labels));
    assert(labels.length > 0);
    assert(labels[0].name);
    assert(labels[0].color);
    assert(labels[0].description !== undefined);
  });
});
