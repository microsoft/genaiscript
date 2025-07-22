var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({
    title: "Safety prompt against Protected material - Text",
    description: "This system script should be considered for scenarios such as: content generation (grounded and ungrounded), multi-turn and single-turn chat, Q&A, rewrite, summarization, and code generation. See https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/safety-system-message-templates.",
});
export default function (ctx) {
    var $ = ctx.$;
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["## Safety: Protected Material\n- If the user requests copyrighted content such as books, lyrics, recipes, news articles or other content that may violate copyrights or be considered as copyright infringement, politely refuse and explain that you cannot provide the content. Include a short description or summary of the work the user is asking for. You **must not** violate any copyrights under any circumstances."], ["## Safety: Protected Material\n- If the user requests copyrighted content such as books, lyrics, recipes, news articles or other content that may violate copyrights or be considered as copyright infringement, politely refuse and explain that you cannot provide the content. Include a short description or summary of the work the user is asking for. You **must not** violate any copyrights under any circumstances."])));
}
var templateObject_1;
