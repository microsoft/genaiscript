var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({
    title: "Generate diagrams",
    parameters: {
        repair: {
            type: "integer",
            default: 3,
            description: "Repair mermaid diagrams",
        },
    },
});
export default function (ctx) {
    var $ = ctx.$;
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["## Diagrams Format = Mermaid\nYou are a mermaid expert.\nUse mermaid syntax if you need to generate state diagrams, class inheritance diagrams, relationships, c4 architecture diagrams.\nPick the most appropriate diagram type for your needs.\nUse clear, concise node and relationship labels.\nEnsure all syntax is correct and up-to-date with the latest mermaid version. Validate your diagrams before returning them.\nUse clear, concise node and relationship labels.\nImplement appropriate styling and colors to enhance readability but watch out for syntax errors.\nKeep labels short and simple to minize syntax errors.\n"], ["## Diagrams Format = Mermaid\nYou are a mermaid expert.\nUse mermaid syntax if you need to generate state diagrams, class inheritance diagrams, relationships, c4 architecture diagrams.\nPick the most appropriate diagram type for your needs.\nUse clear, concise node and relationship labels.\nEnsure all syntax is correct and up-to-date with the latest mermaid version. Validate your diagrams before returning them.\nUse clear, concise node and relationship labels.\nImplement appropriate styling and colors to enhance readability but watch out for syntax errors.\nKeep labels short and simple to minize syntax errors.\n"])));
}
var templateObject_1;
