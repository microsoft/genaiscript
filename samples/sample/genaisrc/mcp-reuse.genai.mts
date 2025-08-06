script({ tests: {}, model: "small" });
const { output } = env;
const fetchClient = await host.mcpServer({
  id: "fetch",
  command: "docker",
  args: ["run", "-i", "--rm", "mcp/fetch"],
  disableToolIdMangling: true,
});
const fetchTools = await fetchClient.listToolCallbacks();
output.itemValue(`tools`, fetchTools.map((t) => t.spec.name).join(", "));
const urls = [
  "https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/SUPPORT.md",
  "https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/README.md",
];
for (const url of urls) {
  const res = await runPrompt((ctx) => {
    ctx.defTool(fetchClient);
    ctx.$`summarize ${url} in one emoji.`;
  });
  output.itemValue(url, res.text);
}
