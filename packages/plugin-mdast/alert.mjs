import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGitHubAlerts from "./dist/esm/remarkalerts.js";
import { inspect } from "unist-util-inspect";
import remarkStringify from 'remark-stringify';

const parseWithPlugin = (markdown) => {
  return unified().use(remarkParse).use(remarkGitHubAlerts).use(remarkStringify).process(markdown);
};

const markdown = `> [!NOTE]
> This is a note alert`;

const ast = await parseWithPlugin(markdown);
console.log(inspect(ast));
