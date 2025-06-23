const changes = await git.diff({
  base: process.env.GITHUB_BASE_REF,
  llmify: true,
});
def("GIT_DIFF", changes, { language: "diff" });
$`Write a poem about the changes.`;
