script({
  tools: ["md_find_files", "fs_read_file"],
  parameters: {
    api: {
      type: "string",
      description: "The API to document.",
      required: true,
    },
  },
});
const { dbg } = env;
const { api } = env.vars;
if (!api) cancel("missing 'api' parameter");
dbg(`api: ${api}`);

const sg = await host.astGrep();
const { matches } = await sg.search(
  "ts",
  ".genaiscript/genaiscript.d.ts",
  YAML`
rule:
  inside:
    kind: interface_declaration
  kind: type_identifier  
  regex: ^${api}$
`,
  { applyGitIgnore: false },
);
dbg(`found ${matches.length} matches for ${api}`);
if (!matches?.length) cancel(`no matches found for ${api}`);

$`You are an expert technical writer for the GenAIScript language.

## Task

Generate a documentation page about the ${api}.
Save to file in the docs/src/content/docs/reference/scripts folder.`;

if (matches?.length) {
  $`## Code
    
    `;
  for (const match of matches) fence(match.text());
}

$`## Information

- use markdown, with Astro Starlight syntax
- the genaiscript type definition: genaisrc/genaiscript.d.ts. Assume that all globals are ambient. Do not import or require genaiscript module.
- the documentation is in markdown and has frontmatter: docs/src/content/docs/**/*.md*
- the online documentation: https://microsoft.github.io/genaiscript/
- the genaiscript samples: packages/sample/src/*.genai.*
- document each api separately with a short example
- use "js" language for genai code blocks
- link to online documentation for related apis
- use const keyword for all variables if possible
- do not add console.log to snippets
- minimize changes to existing documentation
`;

defFileOutput("docs/src/content/docs/reference/scripts/*.md", "Documentation pages");
