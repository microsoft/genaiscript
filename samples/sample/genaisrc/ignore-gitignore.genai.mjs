script({
  ignoreGitIgnore: true,
  files: "node_modules/test-package/package.json",
  tests: {},
  model: "none",
  group: "commit",
});

console.log(env.files.map(({ filename }) => filename).join("\n"));
if (!env.files.length) throw Error("gitignore filter not applied");
