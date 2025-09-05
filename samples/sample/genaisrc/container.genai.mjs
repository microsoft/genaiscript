script({
  model: "small",
  tests: {
    keywords: ["Python", "3."],
  },
});
const { dbg } = env;

const persistent = env.vars.purge === "no";
const container = await host.container({
  name: "testing",
  networkEnabled: true,
  postCreateCommands: "pip install --root-user-action ignore pandas",
  persistent,
});
const version = await container.exec("python", ["--version"]);
if (!/^python \d/i.test(version.stdout)) throw new Error("python --version failed");
await container.writeText("python_version.txt", version.stdout);
const fVersion = await container.readText("python_version.txt");
if (version.stdout !== fVersion)
  throw new Error(`write_text/read_text error, expected '${version.stdout}', got '${fVersion}'`);
await container.copyTo("src/rag/*.md", "/copied");
console.log(await container.listFiles("/copied"));
if (!(await container.readText("/copied/markdown.md"))) throw new Error("copy absolute failed");
await container.copyTo("src/rag/sub/*.md", "copied");
console.log(await container.listFiles("copied"));
if (!(await container.readText("copied/markdown.summary.md"))) throw new Error("copy local failed");
await container.writeText("main.py", 'print("hello")');
console.log(await container.listFiles("."));
console.log(await container.listFiles("/app/"));
const hello = await container.exec("python", ["main.py"]);
if (hello.exitCode) throw new Error("python script failed");
defTool("python_version", "determines the version of python on this system", {}, async () => {
  const version = await container.exec("python", ["--version"]);
  return version.stdout?.replace(/^python\s/i, "") || "?";
});
$`What is the version of python on this machine?`;
