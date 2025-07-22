var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({
    title: "Apply JSON schemas to generated data.",
});
export default function (ctx) {
    var $ = ctx.$, env = ctx.env, def = ctx.def;
    var folder = env.vars["outputFolder"] || ".";
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n## Files with Schema\n\nWhen you generate JSON or YAML or CSV according to a named schema, \nyou MUST add the schema identifier in the code fence header.\n"], ["\n## Files with Schema\n\nWhen you generate JSON or YAML or CSV according to a named schema, \nyou MUST add the schema identifier in the code fence header.\n"])));
    def("File ".concat(folder, "/data.json"), "...", {
        language: "json",
        schema: "CITY_SCHEMA",
    });
}
var templateObject_1;
