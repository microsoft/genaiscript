import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";

const str = JSON.stringify;

for (const fn of process.argv.slice(2)) {
    const suff = ".prompt.md";
    if (!fn.endsWith(suff)) continue;
    console.log(fn);
    const content = readFileSync(fn, "utf-8");

    const m = /^---\n([^]*?)\n---\n([^]*)$/.exec(content);
    const obj = parse(m[1]);
    const text = m[2]
        .replace(/`/g, "\\`")
        .replace(
            /\{\{([^\{\}\n]*):\s*([^\{\}\n]+)\}\}/g,
            (_, n, vn) => `\${def(${str(n)}, env.${vn})}`
        )
        .replace(/\{\{([^\{\}\n]+)\}\}/g, (_, vn) => {
            if (vn.startsWith("@")) {
                obj.categories = [vn.slice("@prompt.".length)];
                return "";
            }
            if (vn == "---") vn = "fence";
            return `\${env.${vn}}`;
        });
    const newText = `prompt(${str(obj)},\`\n${text}\`);\n`;
    writeFileSync(fn.slice(0, -suff.length) + ".prompt.js", newText);
}
