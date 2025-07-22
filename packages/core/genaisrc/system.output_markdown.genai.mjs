var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({ title: "Markdown output system prompt" });
export default function (ctx) {
    var $ = ctx.$;
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["## Markdown Output\nRespond using Markdown syntax (GitHub Flavored Markdown also supported).\n- do NOT respond in JSON.\n- **do NOT wrap response in a 'markdown' code block!**\n"], ["## Markdown Output\nRespond using Markdown syntax (GitHub Flavored Markdown also supported).\n- do NOT respond in JSON.\n- **do NOT wrap response in a 'markdown' code block!**\n"])));
    if (/o3/.test(env.meta.model))
        $(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Formatting re-enabled."], ["Formatting re-enabled."])));
}
var templateObject_1, templateObject_2;
