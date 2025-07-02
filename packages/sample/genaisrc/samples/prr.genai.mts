script({
  title: "Pull Request Reviewer",
  description: "Review the current pull request",
  systemSafety: true,
  tools: ["agent_fs", "agent_git"],
  parameters: {
    base: {
      type: "string",
      description: "The base branch of the pull request",
    },
  },
});

const base = process.env.GITHUB_BASE_REF || env.vars.base || (await git.defaultBranch());
const changes = await git.diff({
  base,
  llmify: true,
});
def("GIT_DIFF", changes, {
  language: "diff",
  maxTokens: 14000,
  detectPromptInjection: "available",
});

$`Report errors in <GIT_DIFF> using the annotation format.

- Use best practices of the programming language of each file.
- If available, provide a URL to the official documentation for the best practice. do NOT invent URLs.
- Analyze ALL the code. Do not be lazy. This is IMPORTANT.
- Use tools to read the entire file content to get more context
- Do not report warnings, only errors.
`;
