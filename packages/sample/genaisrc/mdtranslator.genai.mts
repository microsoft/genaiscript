import { hash } from "crypto";
import { classify, mdast } from "@genaiscript/runtime";
import type { Node, Text, Heading, Paragraph, PhrasingContent } from "mdast";
import { join } from "path";
script({
  accept: ".md,.mdx",
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

const HASH_LENGTH = 20;
function hashNode(node: Node, ancestors: Node[]): string {
  const chunkHash = hash("sha-256", JSON.stringify(node));
  return chunkHash.slice(0, HASH_LENGTH).toUpperCase();
}
const maxPromptPerFile = 5;
const nodeTypes = ["text", "paragraph", "heading"];
const starlightDir = "docs/src/content/docs";
type NodeType = Text | Paragraph | Heading;
const langs = {
  fr: "French",
};

export default async function main() {
  const { files, dbg, output, vars } = env;
  const { force, aiDisclaimer } = vars as {
    to: string;
    force: boolean;
    aiDisclaimer: boolean;
  };

  if (!files.length) cancel("No files selected.");

  const tos = vars.to
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const dbgc = host.logger(`script:md`);
  const dbgt = host.logger(`script:tree`);
  const { parse, stringify, visitParents, SKIP } = await mdast();

  for (const to of tos) {
    let lang = langs[to];
    if (!lang) {
      const res = await prompt`Respond human friendly name of language: ${to}`.options({
        cache: true,
        systemSafety: false,
        responseType: "text",
        throwOnError: true,
      });
      lang = res.text;
    }
    output.heading(2, `Translating Markdown files to ${lang} (${to})`);
    const cacheFn = `docs/translations/${to.toLowerCase()}.json`;
    dbg(`cache: %s`, cacheFn);
    output.itemValue("cache", cacheFn);
    // hash -> text translation
    const translationCache: Record<string, string> = force
      ? {}
      : (await workspace.readJSON(cacheFn)) || {};
    dbgc(`translation cache: %O`, translationCache);

    for (const file of files) {
      const { filename } = file;
      output.heading(3, `${filename}`);

      const starlight = filename.startsWith(starlightDir);
      const translationFn = starlight
        ? filename.replace(starlightDir, join(starlightDir, to.toLowerCase()))
        : path.changeext(filename, `.${to.toLowerCase()}.md`);
      output.itemValue(`translation`, translationFn);
      let content = file.content;
      if (aiDisclaimer)
        content += `\n\n<hr/>\n\nTranslated using AI. Please verify the content for accuracy.\n\n`;
      dbgc(`md: %s`, content);

      // parse to tree
      const root = parse(content);
      dbgt(`original %O`, root.children);

      // collect original nodes nodes
      const nodes: Record<string, NodeType> = {};
      visitParents(root, nodeTypes, (node, ancestors) => {
        const hash = hashNode(node, ancestors);
        nodes[hash] = node as NodeType;
      });

      const llmHashes: Record<string, string> = {};
      const llmHashTodos = new Set<string>();

      // apply translations and mark untranslated nodes with id
      let translated = structuredClone(root);
      visitParents(translated, nodeTypes, (node, ancestors) => {
        const hash = hashNode(node, ancestors);
        const translation = translationCache[hash];
        if (translation) {
          dbg(`translated: %s`, hash);
          Object.assign(node, translation);
        } else {
          // compress long hash into LLM friendly short hash
          const llmHash = `ID${Object.keys(llmHashes).length.toString().padStart(3, "0")}`;
          llmHashes[llmHash] = hash;
          llmHashTodos.add(llmHash);

          // mark untranslated nodes with a unique identifier
          if (node.type === "text") {
            if (/\s*[.,:;]\s*/.test(node.value)) {
              delete llmHashes[llmHash]; // don't translate empty text nodes
              llmHashTodos.delete(llmHash);
              dbg(`skipping empty text node: %s`, hash);
            }
            node.value = `┌${llmHash}┐${node.value}└${llmHash}┘`;
          } else if (node.type === "paragraph" || node.type === "heading") {
            node.children.unshift({
              type: "text",
              value: `┌${llmHash}┐`,
            } as Text);
            node.children.push({
              type: "text",
              value: `└${llmHash}┘`,
            });
            return SKIP; // don't process children of paragraphs
          } else {
            dbg(`untranslated node type: %s`, node.type);
          }
        }
      });

      if (llmHashTodos.size === 0) {
        output.resultItem(true, `No untranslated nodes found, skipping file.`);
        continue;
      }

      dbgt(`translated %O`, translated.children);
      let attempts = 0;
      while (llmHashTodos.size && attempts++ < maxPromptPerFile) {
        dbg(`todos: %O`, llmHashTodos);
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
      - Do not translate inline code blocks, code blocks, or any other code-related content.

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
          const llmHash = fence.language;
          if (llmHashTodos.has(llmHash)) {
            llmHashTodos.delete(llmHash);
            const hash = llmHashes[llmHash];
            dbg(`translation: %s - %s`, llmHash, hash);
            let chunkTranslated = fence.content.replace(/\r?\n$/, "").trim();
            const node = nodes[hash];
            dbg(`original node: %O`, node);
            if (node.type === "text" && /\s$/.test(node.value)) {
              // preserve trailing space if original text had it
              dbg(`patch trailing space for %s`, hash);
              chunkTranslated += " ";
            }
            dbg(`content: %s`, chunkTranslated);
            translationCache[hash] = chunkTranslated;
          }
        }
      }

      // apply translations
      translated = structuredClone(root);
      visitParents(translated, nodeTypes, (node, ancestors) => {
        const hash = hashNode(node, ancestors);
        const translation = translationCache[hash];
        if (translation) {
          if (node.type === "text") {
            dbg(`translated text: %s -> %s`, hash, translation);
            node.value = translation;
          } else if (node.type === "paragraph" || node.type === "heading") {
            dbg(`translated %s: %s -> %s`, node.type, hash, translation);
            const newNodes = parse(translation).children as PhrasingContent[];
            node.children.splice(0, node.children.length, ...newNodes);
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
          ctx.$`You are an expert at judging the quality of translations. 
          Your task is to determine the quality of the translation of a Markdown document from English to ${lang} (${to}).
          The original document is in ${ctx.def("ORIGINAL", content)}, and the translated document is provided as a variable named ${ctx.def("TRANSLATED", contentTranslated)}.`.role(
            "system",
          );
        },
        {
          ok: `Translation is faithful to the original document and conveys the same meaning. Translation uses proper ${lang}.`,
          bad: `Translation is of low quality or poor usage of ${lang}.`,
        },
        {
          explanations: true,
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

    await workspace.writeText(cacheFn, JSON.stringify(translationCache, null, 2));
  }
}
