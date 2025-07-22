var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({
    title: "Today's date.",
});
export default function (ctx) {
    var $ = ctx.$;
    var date = new Date();
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["- Today is ", "."], ["- Today is ", "."])), date.toDateString());
}
var templateObject_1;
