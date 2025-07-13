system({
  title: "git read operations",
  description: "Tools to query a git repository.",
  parameters: {
    cwd: {
      type: "string",
      description: "Current working directory",
      required: false,
    },
  },
});

export default function (ctx: ChatGenerationContext) {
  const { env, defTool } = ctx;
  const { vars } = env;
  const cwd = vars["system.git.cwd"];
  const client = cwd ? git.client(cwd) : git;

  defTool("git_branch_default", "Gets the default branch using client.", {}, async () => {
    return await client.defaultBranch();
  });

  defTool("git_branch_current", "Gets the current branch using client.", {}, async () => {
    return await client.branch();
  });

  defTool("git_branch_list", "List all branches using client.", {}, async () => {
    return await client.exec("branch");
  });

  defTool(
    "git_list_commits",
    "Generates a history of commits using the git log command.",
    {
      type: "object",
      properties: {
        base: {
          type: "string",
          description: "Base branch to compare against.",
        },
        head: {
          type: "string",
          description: "Head branch to compare",
        },
        count: {
          type: "number",
          description: "Number of commits to return",
        },
        author: {
          type: "string",
          description: "Author to filter by",
        },
        until: {
          type: "string",
          description: "Display commits until the given date. Formatted yyyy-mm-dd",
        },
        after: {
          type: "string",
          description: "Display commits after the given date. Formatted yyyy-mm-dd",
        },
        paths: {
          type: "array",
          description: "Paths to compare",
          items: {
            type: "string",
            description: "File path or wildcard supported by git",
          },
        },
        excludedPaths: {
          type: "array",
          description: "Paths to exclude",
          items: {
            type: "string",
            description: "File path or wildcard supported by git",
          },
        },
      },
    },
    async (args) => {
      const { context, base, head, paths, excludedPaths, count, author, until, after } = args;
      const commits = await client.log({
        base,
        head,
        author,
        paths,
        until,
        after,
        excludedPaths,
        count,
      });
      const res = commits
        .map(({ sha, date, author, message }) => `${sha} ${date} ${author} ${message}`)
        .join("\n");
      context.debug(res);
      return res;
    },
  );

  defTool("git_status", "Generates a status of the repository using client.", {}, async () => {
    return await client.exec(["status", "--porcelain"]);
  });

  defTool("git_last_tag", "Gets the last tag using client.", {}, async () => {
    return await client.lastTag();
  });
}
