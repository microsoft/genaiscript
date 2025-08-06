script({
  ignoreGitIgnore: true,
  files: "node_modules/test-package/package.json",
  tests: {},
  model: "echo",
  group: "commit",
});

console.log(env.files.map(({ filename }) => filename).join("\n"));
if (!env.files.length) throw Error("gitignore filter not applied");
