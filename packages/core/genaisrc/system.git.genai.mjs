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
    title: "git read operations",
    description: "Tools to query a git repository.",
    parameters: {
        cwd: {
            type: "string",
            description: "Current working directory",
            required: false,
        },
    },
});
export default function (ctx) {
    var _this = this;
    var env = ctx.env, defTool = ctx.defTool;
    var vars = env.vars;
    var cwd = vars["system.git.cwd"];
    var client = cwd ? git.client(cwd) : git;
    defTool("git_branch_default", "Gets the default branch using client.", {}, function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.defaultBranch()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); });
    defTool("git_branch_current", "Gets the current branch using client.", {}, function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.branch()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); });
    defTool("git_branch_list", "List all branches using client.", {}, function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.exec("branch")];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); });
    defTool("git_list_commits", "Generates a history of commits using the git log command.", {
        type: "object",
        properties: {
            base: {
                type: "string",
                description: "Base branch to compare against.",
            },
            head: {
                type: "string",
                description: "Head branch to compare",
            },
            count: {
                type: "number",
                description: "Number of commits to return",
            },
            author: {
                type: "string",
                description: "Author to filter by",
            },
            until: {
                type: "string",
                description: "Display commits until the given date. Formatted yyyy-mm-dd",
            },
            after: {
                type: "string",
                description: "Display commits after the given date. Formatted yyyy-mm-dd",
            },
            paths: {
                type: "array",
                description: "Paths to compare",
                items: {
                    type: "string",
                    description: "File path or wildcard supported by git",
                },
            },
            excludedPaths: {
                type: "array",
                description: "Paths to exclude",
                items: {
                    type: "string",
                    description: "File path or wildcard supported by git",
                },
            },
        },
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, base, head, paths, excludedPaths, count, author, until, after, commits, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = args.context, base = args.base, head = args.head, paths = args.paths, excludedPaths = args.excludedPaths, count = args.count, author = args.author, until = args.until, after = args.after;
                    return [4 /*yield*/, client.log({
                            base: base,
                            head: head,
                            author: author,
                            paths: paths,
                            until: until,
                            after: after,
                            excludedPaths: excludedPaths,
                            count: count,
                        })];
                case 1:
                    commits = _a.sent();
                    res = commits
                        .map(function (_a) {
                        var sha = _a.sha, date = _a.date, author = _a.author, message = _a.message;
                        return "".concat(sha, " ").concat(date, " ").concat(author, " ").concat(message);
                    })
                        .join("\n");
                    context.debug(res);
                    return [2 /*return*/, res];
            }
        });
    }); });
    defTool("git_status", "Generates a status of the repository using client.", {}, function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.exec(["status", "--porcelain"])];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); });
    defTool("git_last_tag", "Gets the last tag using client.", {}, function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.lastTag()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); });
}
