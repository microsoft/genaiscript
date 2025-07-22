var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({
    title: "Canary World Prompt Leak protection",
    description: "Injects a canary word into the system prompts and monitor the generated output for leaks.",
});
var adjectives = [
    "Zephyr",
    "Lunar",
    "Thunder",
    "Velvet",
    "Ember",
    "Quartz",
    "Solar",
    "Neon",
    "Mystic",
    "Blaze",
    "Granite",
    "Crystal",
    "Wisp",
    "Phantom",
    "Mirage",
    "Starling",
    "Dusk",
    "Vortex",
    "Fable",
    "Sonic",
    "Tempest",
];
var nouns = [
    "Fox",
    "Pineapple",
    "Cactus",
    "Lion",
    "Serpent",
    "Butterfly",
    "Frost",
    "Badger",
    "Tulip",
    "Kangaroo",
    "Falcon",
    "Tiger",
    "Cedar",
    "Orchid",
    "Swan",
    "Ash",
    "Nettle",
    "Otter",
    "Birch",
    "Aspen",
    "Gazelle",
];
var canaries = Array(2)
    .fill(0)
    .map(function () {
    return adjectives[Math.floor(Math.random() * adjectives.length)] +
        nouns[Math.floor(Math.random() * nouns.length)];
});
export default function (ctx) {
    var $ = ctx.$, defChatParticipant = ctx.defChatParticipant;
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", "."], ["", "."])), canaries.join(", "));
    defChatParticipant(function (ctx, messages) {
        var assistants = messages.filter(function (_a) {
            var role = _a.role;
            return role === "assistant";
        });
        var matches = assistants.filter(function (_a) {
            var content = _a.content;
            return canaries.some(function (canary) {
                return (typeof content === "string" && content.includes(canary)) ||
                    (Array.isArray(content) &&
                        content.some(function (c) { var _a; return (_a = c.text) === null || _a === void 0 ? void 0 : _a.includes(canary); }));
            });
        });
        if (matches.length > 0)
            throw new Error("Canary word detected in assistant message");
    });
}
var templateObject_1;
