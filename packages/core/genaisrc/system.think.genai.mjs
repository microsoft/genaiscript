var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
system({
    title: "The think tool",
    description: "The Anthropic 'think' tool as defined in https://www.anthropic.com/engineering/claude-think-tool. Uses the 'think' model alias.",
});
export default function (ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var defTool, $;
        var _this = this;
        return __generator(this, function (_a) {
            defTool = ctx.defTool, $ = ctx.$;
            defTool("think", "Use the tool to think about something. It will not obtain new information or change the database, but just append the thought to the log. Use it when complex reasoning or some cache memory is needed.", {
                type: "object",
                properties: {
                    thought: {
                        type: "string",
                        description: "A thought to think about.",
                    },
                },
                required: ["thought"],
            }, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                var thought = _b.thought;
                return __generator(this, function (_c) {
                    return [2 /*return*/, thought];
                });
            }); });
            $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["## Using the think tool\n\nBefore taking any action or responding to the user after receiving tool results, use the think tool as a scratchpad to:\n- List the specific rules that apply to the current request\n- Check if all required information is collected\n- Verify that the planned action complies with all policies\n- Iterate over tool results for correctness \n\nHere are some examples of what to iterate over inside the think tool:\n<think_tool_example_1>\nUser wants to cancel flight ABC123\n- Need to verify: user ID, reservation ID, reason\n- Check cancellation rules:\n  * Is it within 24h of booking?\n  * If not, check ticket class and insurance\n- Verify no segments flown or are in the past\n- Plan: collect missing info, verify rules, get confirmation\n</think_tool_example_1>\n\n<think_tool_example_2>\nUser wants to book 3 tickets to NYC with 2 checked bags each\n- Need user ID to check:\n  * Membership tier for baggage allowance\n  * Which payments methods exist in profile\n- Baggage calculation:\n  * Economy class \u00D7 3 passengers\n  * If regular member: 1 free bag each \u2192 3 extra bags = $150\n  * If silver member: 2 free bags each \u2192 0 extra bags = $0\n  * If gold member: 3 free bags each \u2192 0 extra bags = $0\n- Payment rules to verify:\n  * Max 1 travel certificate, 1 credit card, 3 gift cards\n  * All payment methods must be in profile\n  * Travel certificate remainder goes to waste\n- Plan:\n1. Get user ID\n2. Verify membership level for bag fees\n3. Check which payment methods in profile and if their combination is allowed\n4. Calculate total: ticket price + any bag fees\n5. Get explicit confirmation for booking\n</think_tool_example_2>"], ["## Using the think tool\n\nBefore taking any action or responding to the user after receiving tool results, use the think tool as a scratchpad to:\n- List the specific rules that apply to the current request\n- Check if all required information is collected\n- Verify that the planned action complies with all policies\n- Iterate over tool results for correctness \n\nHere are some examples of what to iterate over inside the think tool:\n<think_tool_example_1>\nUser wants to cancel flight ABC123\n- Need to verify: user ID, reservation ID, reason\n- Check cancellation rules:\n  * Is it within 24h of booking?\n  * If not, check ticket class and insurance\n- Verify no segments flown or are in the past\n- Plan: collect missing info, verify rules, get confirmation\n</think_tool_example_1>\n\n<think_tool_example_2>\nUser wants to book 3 tickets to NYC with 2 checked bags each\n- Need user ID to check:\n  * Membership tier for baggage allowance\n  * Which payments methods exist in profile\n- Baggage calculation:\n  * Economy class \u00D7 3 passengers\n  * If regular member: 1 free bag each \u2192 3 extra bags = $150\n  * If silver member: 2 free bags each \u2192 0 extra bags = $0\n  * If gold member: 3 free bags each \u2192 0 extra bags = $0\n- Payment rules to verify:\n  * Max 1 travel certificate, 1 credit card, 3 gift cards\n  * All payment methods must be in profile\n  * Travel certificate remainder goes to waste\n- Plan:\n1. Get user ID\n2. Verify membership level for bag fees\n3. Check which payment methods in profile and if their combination is allowed\n4. Calculate total: ticket price + any bag fees\n5. Get explicit confirmation for booking\n</think_tool_example_2>"])));
            return [2 /*return*/];
        });
    });
}
var templateObject_1;
