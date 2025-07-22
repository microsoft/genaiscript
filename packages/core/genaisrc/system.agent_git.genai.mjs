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
    title: "Agent that can query Git to accomplish tasks.",
    parameters: {
        cwd: {
            type: "string",
            description: "Current working directory",
            required: false,
        },
        repo: {
            type: "string",
            description: "Repository URL or GitHub slug",
            required: false,
        },
        branch: {
            type: "string",
            description: "Branch to checkout",
            required: false,
        },
        variant: {
            type: "string",
            description: "Suffix to append to the agent name",
            required: false,
        },
    },
});
export default function defAgentGit(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var env, defAgent, vars, cwd, repo, branch, variant, client;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    env = ctx.env, defAgent = ctx.defAgent;
                    vars = env.vars;
                    cwd = vars["system.agent_git.cwd"];
                    repo = vars["system.agent_git.repo"];
                    branch = vars["system.agent_git.branch"];
                    variant = vars["system.agent_git.variant"];
                    if (!(!cwd && repo)) return [3 /*break*/, 2];
                    return [4 /*yield*/, git.shallowClone(repo, {
                            branch: branch,
                            depth: 50,
                            force: true,
                        })];
                case 1:
                    client = _b.sent();
                    cwd = client.cwd;
                    _b.label = 2;
                case 2:
                    defAgent("git", "query the current repository using Git to accomplish tasks. Provide all the context information available to execute git queries.", "Your are a helpful LLM agent that can use the git tools to query the current repository.\n    Answer the question in <QUERY>.\n    - The current repository is the same as github repository.\n    - Prefer using diff to compare files rather than listing files. Listing files is only useful when you need to read the content of the files.\n    ", {
                        variant: variant,
                        variantDescription: (_a = (variant && repo)) !== null && _a !== void 0 ? _a : "query ".concat(repo, " repository using Git to accomplish tasks. Provide all the context information available to execute git queries."),
                        system: [
                            "system.github_info",
                            { id: "system.git_info", parameters: { cwd: cwd } },
                            { id: "system.git", parameters: { cwd: cwd } },
                            { id: "system.git_diff", parameters: { cwd: cwd } },
                        ],
                    });
                    return [2 /*return*/];
            }
        });
    });
}
