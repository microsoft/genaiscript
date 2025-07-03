script({ model: "none" });

const { cwd } = await git.shallowClone("microsoft/genaiscript", {
  branch: "gh-pages",
});
console.log(`git: ${cwd}`);

const { text } = await runPrompt(`What is the current git repo and branch?`, {
  model: "small",
  system: [
    { id: "system.git_info", parameters: { cwd } },
    { id: "system.git_diff", parameters: { cwd, variant: "gh-pages" } },
  ],
  label: "git info",
});

console.log(text);
if (!text.includes("gh-page")) throw new Error("Expected gh-pages branch");
