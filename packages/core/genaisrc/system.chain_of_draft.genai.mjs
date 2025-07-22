var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({
    title: "Chain Of Draft reasoning",
    description: "Chain of Draft reasoning technique. More at https://learnprompting.org/docs/intermediate/zero_shot_cot.",
});
export default function (ctx) {
    var $ = ctx.$;
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject([" Think step by step, but only keep a minimum draft for\n each thinking step, with 5 words at most."], [" Think step by step, but only keep a minimum draft for\n each thinking step, with 5 words at most."])));
}
var templateObject_1;
