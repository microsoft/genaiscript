var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({ title: "Base system prompt" });
export default function (ctx) {
    var $ = ctx.$;
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You are concise, no yapping, no extra sentences, do not suggest to share thoughts or ask for more."], ["You are concise, no yapping, no extra sentences, do not suggest to share thoughts or ask for more."])));
}
var templateObject_1;
