var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
    title: "Model Context Protocol Agent",
    description: "Wraps a MCP server with an agent.",
    parameters: {
        description: {
            type: "string",
            description: "Description of the MCP server and agent.",
            required: true,
        },
        id: {
            type: "string",
            description: "The unique identifier for the MCP server.",
            required: true,
        },
        command: {
            type: "string",
            description: "The command to run the MCP server.",
            required: true,
        },
        args: {
            type: "array",
            items: { type: "string" },
            description: "The arguments to pass to the command.",
        },
        version: {
            type: "string",
            description: "The version of the MCP server.",
        },
        instructions: {
            type: "string",
            description: "Instructions for the agent on how to use the MCP server.",
        },
        maxTokens: {
            type: "integer",
            minimum: 16,
            description: "Maximum number of tokens returned by the tools.",
        },
        toolsSha: {
            type: "string",
            description: "The SHA256 hash of the tools returned by the MCP server.",
        },
        contentSafety: {
            type: "string",
            description: "Content safety provider",
            enum: ["azure"],
        },
        detectPromptInjection: {
            anyOf: [
                { type: "string" },
                { type: "boolean", enum: ["always", "available"] },
            ],
            description: "Whether to detect prompt injection attacks in the MCP server.",
        },
        intent: {
            type: "any",
            description: "the intent of the tools",
        },
    },
});
export default function (ctx) {
    var _a;
    var _this = this;
    var env = ctx.env, defAgent = ctx.defAgent;
    var vars = env.vars;
    var dbg = host.logger("genaiscript:mcp:agent");
    var id = vars["system.agent_mcp.id"];
    var description = vars["system.agent_mcp.description"];
    var command = vars["system.agent_mcp.command"];
    var args = vars["system.agent_mcp.args"] || [];
    var version = vars["system.agent_mcp.version"];
    var instructions = vars["system.agent_mcp.instructions"];
    var maxTokens = vars["system.agent_mcp.maxTokens"];
    var toolsSha = vars["system.mcp.toolsSha"];
    var contentSafety = vars["system.mcp.contentSafety"];
    var detectPromptInjection = vars["system.mcp.detectPromptInjection"];
    var intent = vars["system.mcp.intent"];
    if (!id)
        throw new Error("Missing required parameter: id");
    if (!description)
        throw new Error("Missing required parameter: description");
    if (!command)
        throw new Error("Missing required parameter: command");
    var configs = (_a = {},
        _a[id] = {
            command: command,
            args: args,
            version: version,
            toolsSha: toolsSha,
            contentSafety: contentSafety,
            detectPromptInjection: detectPromptInjection,
            intent: intent,
        },
        _a);
    var toolOptions = {
        maxTokens: maxTokens,
        contentSafety: contentSafety,
        detectPromptInjection: detectPromptInjection,
    };
    dbg("loading %s %O %O", id, configs, toolOptions);
    defAgent(id, description, function (agentCtx) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            dbg("defining agent %s", id);
            agentCtx.defTool(configs, toolOptions);
            if (instructions)
                agentCtx.$(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", ""], ["", ""])), instructions).role("system");
            return [2 /*return*/];
        });
    }); }, __assign(__assign({}, toolOptions), { system: [
            "system",
            "system.tools",
            "system.explanations",
            "system.assistant",
        ] }));
}
var templateObject_1;
