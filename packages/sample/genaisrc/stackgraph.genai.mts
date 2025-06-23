script({ model: "none" });
const dbg = host.logger("stackgraph");

export async function stackGraph(lang: OptionsOrString<"typescript">) {
  const crate = `tree-sitter-stack-graphs-${lang}`;
  const res = await host.exec(`cargo install --features cli ${crate}`);
  const databasePath = "./.genaiscript/db";

  dbg(res.stderr);
  if (res.exitCode) throw new Error(`Failed to install ${crate}: ${res.stderr}`);

  const index = async (sourceDir: string) => {
    dbg(`indexing ${sourceDir}...`);
    const res = await host.exec(
      `${crate} index ${sourceDir} --verbose --stats --database ${databasePath}`,
    );
    dbg(res.stdout);
    if (res.exitCode) throw new Error(`Failed to index ${sourceDir}: ${res.stderr}`);
  };

  const query = async (node: SgNode) => {
    const sourcePath = node.getRoot().filename();
    const range = node.range();
    const line = range.start.line + 1;
    const column = range.start.column + 1;

    dbg(`querying ${sourcePath}:${line}:${column}...`);
    const res = await host.exec(
      `${crate} query --database ${databasePath} definition ${sourcePath}:${line}:${column}`,
    );
    dbg(res.stdout);
    if (res.exitCode) throw new Error(`Failed to query ${sourcePath}: ${res.stderr}`);

    const n = /has ((\d+) definitions|definition)/.exec(res.stdout);
    if (!n) return [];

    const matches = res.stdout.slice(n.index + n[0].length);
    const locs = [];
    matches.replace(/^(.*?):(\d+):(\d+):$/gm, (_, filename, line, column) => {
      locs.push({
        filename,
        line: parseInt(line) - 1,
        column: parseInt(column) - 1,
      });
      return "";
    });
    dbg(`references: %O`, locs);
    const refs: SgNode[] = [];
    for (const loc of locs) {
      const line = (await workspace.readText(loc.filename)).content.split(/\n/g)[loc.line];
      const end = loc.column + /\W/.exec(line.slice(loc.column + 1))?.index + 1;
      dbg(`ast-search ${loc.filename} (${loc.line}, ${loc.column})-(${loc.line}, ${end}) `);
      const node = await sg.search(lang, loc.filename, {
        rule: {
          range: {
            start: {
              line: loc.line,
              column: loc.column,
            },
            end: {
              line: loc.line,
              column: end,
            },
          },
        },
      });
      dbg(
        `ast-search results: %O`,
        node.matches.map((m) => `${m.text()}: ${m.kind()}`),
      );
      refs.push(...node.matches);
    }
    return refs;
  };

  return {
    lang,
    databasePath,
    index,
    query,
  };
}

const graph = await stackGraph("typescript");
const dir = "packages/sample/src";
await graph.index(dir);

const sg = await host.astGrep();
const { matches } = await sg.search(
  "ts",
  `${dir}/*.ts`,
  YAML`
rule:
  kind: identifier
`,
);

for (const match of matches) {
  console.log(match.text());
  const locs = await graph.query(match);
  for (const loc of locs) {
    console.log(`  ${loc.text()}`);
  }
}
