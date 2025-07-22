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
    title: "Agent that can query on the documentation.",
    parameters: {
        dir: {
            type: "string",
            description: "The documentation root folder",
            required: false,
        },
        samples: {
            type: "string",
            description: "The code samples root folder",
            required: false,
        },
    },
});
export default function (ctx) {
    var _this = this;
    var env = ctx.env, defAgent = ctx.defAgent;
    var docsRoot = env.vars["system.agent_docs.dir"] || "docs";
    var samplesRoot = env.vars["system.agent_docs.samples"] || "packages/sample/genaisrc/";
    defAgent("docs", "query the documentation", function (ctx) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            ctx.$(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Your are a helpful LLM agent that is an expert at Technical documentation. You can provide the best analyzis to any query about the documentation.\n\n        Analyze <QUERY> and respond with the requested information.\n\n        ## Tools\n\n        The 'md_find_files' can perform a grep search over the documentation files and return the title, description, and filename for each match.\n        To optimize search, convert the QUERY request into keywords or a regex pattern.\n\n        Try multiple searches if you cannot find relevant files.\n        \n        ## Context\n\n        - the documentation is stored in markdown/MDX files in the ", " folder\n        ", "\n        "], ["Your are a helpful LLM agent that is an expert at Technical documentation. You can provide the best analyzis to any query about the documentation.\n\n        Analyze <QUERY> and respond with the requested information.\n\n        ## Tools\n\n        The 'md_find_files' can perform a grep search over the documentation files and return the title, description, and filename for each match.\n        To optimize search, convert the QUERY request into keywords or a regex pattern.\n\n        Try multiple searches if you cannot find relevant files.\n        \n        ## Context\n\n        - the documentation is stored in markdown/MDX files in the ", " folder\n        ", "\n        "])), docsRoot, samplesRoot ? "- the code samples are stored in the ".concat(samplesRoot, " folder") : "");
            return [2 /*return*/];
        });
    }); }, {
        system: ["system.explanations", "system.github_info"],
        tools: [
            "md_find_files",
            "md_read_frontmatter",
            "fs_find_files",
            "fs_read_file",
            "fs_ask_file",
        ],
        maxTokens: 5000,
    });
}
var templateObject_1;
