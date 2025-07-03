defAgent(
  "git-cli",
  "Query a repo with Git to accomplish tasks",
  `You're a helpful LLM agent that can use a subset of git commands on the current repository.
    Answer the question in QUERY.`,
  { system: ["system.git", "system.git_diff"] },
);

$`Create a file CHANGELOG.md.
  Include a list of changes based on the last 15 commits, including new features, bug fixes, and breaking changes. Be clear and concise, do not include any unnecessary details and skip useless commits.
  Use emojis to make the changelog more engaging.`;
