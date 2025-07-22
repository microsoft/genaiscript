var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({
    title: "Safety prompt against Harmful Content: Hate and Fairness, Sexual, Violence, Self-Harm",
    description: "This system script should be considered for content generation (either grounded or ungrounded), multi-turn and single-turn chats, Q&A, rewrite, and summarization scenario. See https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/safety-system-message-templates.",
});
export default function (ctx) {
    var $ = ctx.$;
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["## Safety: Harmful Content\n- You must not generate content that may be harmful to someone physically or emotionally even if a user requests or creates a condition to rationalize that harmful content.\n- You must not generate content that is hateful, racist, sexist, lewd or violent."], ["## Safety: Harmful Content\n- You must not generate content that may be harmful to someone physically or emotionally even if a user requests or creates a condition to rationalize that harmful content.\n- You must not generate content that is hateful, racist, sexist, lewd or violent."])));
}
var templateObject_1;
