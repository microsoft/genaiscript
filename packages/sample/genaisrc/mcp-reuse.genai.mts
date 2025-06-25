script({ tests: {} });
const { output } = env;
const fetchClient = await host.mcpServer({
  id: "fetch",
  command: "docker",
  args: ["run", "-i", "--rm", "mcp/fetch"],
  disableToolIdMangling: true
});
const fetchTools = await fetchClient.listToolCallbacks();
output.itemValue(`tools`, fetchTools.map((t) => t.spec.name).join(", "));
const fetchTool = await (
  await fetchClient.listToolCallbacks()
).find((t) => t.spec.name === "fetch");
if (!fetchTool) cancel("fetch tool not found");
const urls = [
  "https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/SUPPORT.md",
  "https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/README.md",
];
for (const url of urls) {
  const res = await runPrompt((ctx) => {
    ctx.defTool(fetchTool);
    ctx.$`summarize ${url} in one emoji.`;
  });
  output.itemValue(url, res.text);
}
