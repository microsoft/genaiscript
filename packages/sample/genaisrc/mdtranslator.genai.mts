import { hash } from "crypto";
import { classify, mdast } from "@genaiscript/runtime";
script({
  accept: ".md",
  files: "src/rag/markdown.md",
  parameters: {
    to: {
      type: "string",
      default: "fr",
      description: "The iso-code target language for translation.",
    },
    force: {
      type: "boolean",
      default: false,
      description: "Force translation even if the file has already been translated.",
    },
    aiDisclaimer: {
      type: "boolean",
      default: true,
      description: "Include a disclaimer about AI-generated content.",
    },
  },
});

function hashNode(node: unknown): string {
  const chunkHash = hash("sha-256", JSON.stringify(node));
  return chunkHash.slice(0, 8).toUpperCase();
}

const maxPromptPerFile = 5;

export default async function main() {
  const { files, dbg, output, vars } = env;
  const { force, aiDisclaimer } = vars as { to: string; force: boolean; aiDisclaimer: boolean };
  const tos = vars.to
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const dbgc = host.logger(`script:md`);
  const dbgt = host.logger(`script:tree`);
  const { parse, stringify, visit } = await mdast();

  for (const to of tos) {
    const { text: lang } = await prompt`Respond human friendly name of language: ${to}`.options({
      cache: true,
      systemSafety: false,
      responseType: "text",
    });
    output.heading(2, `Translating Markdown files to ${lang} (${to})`);
    const cacheFn = `docs/translations/${to.toLowerCase()}.json`;
    dbg(`cache: %s`, cacheFn);
    output.itemValue("cache", cacheFn);
    const cache = force ? {} : (await workspace.readJSON(cacheFn)) || {};
    dbgc(`cache: %O`, cache);

    const nodeTypes = ["text"];
    for (const file of files) {
      const { filename } = file;
      let content = file.content;
      if (aiDisclaimer)
        content += `\n\n<hr/>\n\nTranslated using AI. Please verify the content for accuracy.\n\n`;

      const translationFn = path.changeext(file.filename, `.${to.toLowerCase()}.md`);

      output.heading(3, `${filename}`);
      output.itemValue(`translation`, translationFn);

      dbgc(`md: %s`, content);

      // parse to tree
      const root = parse(content);
      dbgt(`original %O`, root.children);

      const nodes = {};
      // apply translations and mark untranslated nodes with id
      let translated = structuredClone(root);
      const todos = new Set<string>();
      visit(translated, nodeTypes, (node) => {
        const hash = hashNode(node);
        nodes[hash] = node;
        const translation = cache[hash];
        if (translation) {
          dbg(`translated: %s`, hash);
          Object.assign(node, translation);
        } else {
          todos.add(hash);
          if (node.type === "text" && node.value) {
            node.value = `┌${hash}┐${node.value}└${hash}┘`;
          } else {
            dbg(`untranslated node type: %s`, node.type);
          }
        }
      });

      dbgt(`translated %O`, translated.children);
      let attempts = 0;
      while (todos.size && attempts++ < maxPromptPerFile) {
        dbg(`todos: %O`, todos);
        const contentMix = stringify(translated);
        dbgc(`translatable content: %s`, contentMix);

        // run prompt to generate translations
        const { fences, error } = await runPrompt(
          async (ctx) => {
            const originalRef = ctx.def("ORIGINAL", file.content);
            const translatedRef = ctx.def("TRANSLATED", contentMix);
            ctx.$`You are an expert at translating technical documentation into ${lang} (${to}).
      
      ## Task
      Your task is to translate a Markdown (GFM) document to ${lang} (${to}) while preserving the structure and formatting of the original document.
      You will receive the original document as a variable named ${originalRef} and the currently translated document as a variable named ${translatedRef}.

      Each node in the translated document that has not been translated yet will have a unique identifier in the form of \`┌HASH┐\` at the start and \`└HASH┘\` at the end of the node.
      You should translate the content of each these nodes.
      Example:

      \`\`\`markdown
      ┌HASH1┐
      This is the content to be translated.
      └HASH1┘

      This is some other content that does not need translation.

      ┌HASH2
      This is another piece of content to be translated.
      └HASH2
      \`\`\`

      ## Output format

      Respond using code regions where the language string is the HASH value
      For example:
      
      \`\`\`HASH
      translated content of text enclosed in HASH1 here
      \`\`\`

      \`\`\`HASH2
      translated content of text enclosed in HASH2 here
      \`\`\`

      ## Instructions

      - Be extremely careful about the HASH names. They are unique identifiers for each node and should not be changed.
      - Use code regions to respond with the translated content.
      - Do not translate the text outside of the HASH tags.
      - Do not change the structure of the document.
      - As much as possible, maintain the original formatting and structure of the document.

      `.role("system");
          },
          {
            responseType: "text",
            systemSafety: false,
            system: [],
            cache: true,
            label: `translating ${file.filename}`,
          },
        );

        if (error) {
          output.error(`Error translating ${file.filename}: ${error.message}`);
          continue;
        }

        // collect translations
        for (const fence of fences) {
          const hash = fence.language;
          if (todos.has(hash)) {
            todos.delete(hash);
            dbg(`translation: %s`, hash);
            let chunkTranslated = fence.content.replace(/\r?\n$/, "").trim();
            const node = nodes[hash];
            if (node.type === "text" && /\s$/.test(node.value)) chunkTranslated += " ";
            dbg(`content: %s`, chunkTranslated);
            cache[hash] = chunkTranslated;
          }
        }
      }

      // apply translations
      translated = structuredClone(root);
      await visit(translated, nodeTypes, (node) => {
        const hash = hashNode(node);
        const translation = cache[hash];
        if (translation) {
          if (node.type === "text") {
            dbg(`translated: %s -> %s`, hash, translation);
            node.value = translation;
          } else {
            dbg(`untranslated node type: %s`, node.type);
          }
        }
      });

      let contentTranslated = await stringify(translated);
      output.diff(content, contentTranslated);
      if (content === contentTranslated) {
        output.warn(`Unable to translate anything, skipping file.`);
        continue;
      }

      // judge quality is good enough
      const res = await classify(
        (ctx) => {
          ctx.$`You are an expert at judging the quality of translations. Your task is to determine if the translation of a Markdown document from English to ${to} is of high quality.
      The original document is provided as a variable named ${ctx.def("ORIGINAL", content)}, and the translated document is provided as a variable named ${ctx.def("TRANSLATED", contentTranslated)}.`.role(
            "system",
          );
        },
        { ok: "Translation is of high quality.", bad: "Translation is of low quality." },
        {
          systemSafety: false,
        },
      );

      if (res.label !== "ok") {
        output.error(`Translation quality is low. Skipping file.`);
        output.fence(res.answer);
        continue;
      }

      // apply translations and save
      dbgc(`translated: %s`, contentTranslated);
      dbg(`writing translation to %s`, translationFn);

      await workspace.writeText(translationFn, contentTranslated);
    }

    await workspace.writeText(cacheFn, JSON.stringify(cache, null, 2));
  }
}
