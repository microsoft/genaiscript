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
    title: "Tools to query GitHub issues.",
});
export default function (ctx) {
    var _this = this;
    var defTool = ctx.defTool;
    defTool("github_issues_list", "List all issues in a repository.", {
        type: "object",
        properties: {
            state: {
                type: "string",
                enum: ["open", "closed", "all"],
                description: "state of the issue from  'open, 'closed', 'all'. Default is 'open'.",
            },
            count: {
                type: "number",
                description: "Number of issues to list. Default is 20.",
            },
            labels: {
                type: "string",
                description: "Comma-separated list of labels to filter by.",
            },
            sort: {
                type: "string",
                enum: ["created", "updated", "comments"],
                description: "What to sort by",
            },
            direction: {
                type: "string",
                enum: ["asc", "desc"],
                description: "Direction to sort",
            },
            creator: {
                type: "string",
                description: "Filter by creator",
            },
            assignee: {
                type: "string",
                description: "Filter by assignee",
            },
            since: {
                type: "string",
                description: "Only issues updated at or after this time are returned.",
            },
            mentioned: {
                type: "string",
                description: "Filter by mentioned user",
            },
        },
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var _a, state, labels, sort, direction, context, creator, assignee, since, mentioned, count, res;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = args.state, state = _a === void 0 ? "open" : _a, labels = args.labels, sort = args.sort, direction = args.direction, context = args.context, creator = args.creator, assignee = args.assignee, since = args.since, mentioned = args.mentioned, count = args.count;
                    context.log("github issue list ".concat(state !== null && state !== void 0 ? state : "all"));
                    return [4 /*yield*/, github.listIssues({
                            state: state,
                            labels: labels,
                            sort: sort,
                            direction: direction,
                            creator: creator,
                            assignee: assignee,
                            since: since,
                            mentioned: mentioned,
                            count: count,
                        })];
                case 1:
                    res = _b.sent();
                    return [2 /*return*/, CSV.stringify(res.map(function (_a) {
                            var number = _a.number, title = _a.title, state = _a.state, user = _a.user, assignee = _a.assignee;
                            return ({
                                number: number,
                                title: title,
                                state: state,
                                user: (user === null || user === void 0 ? void 0 : user.login) || "",
                                assignee: (assignee === null || assignee === void 0 ? void 0 : assignee.login) || "",
                            });
                        }), { header: true })];
            }
        });
    }); });
    defTool("github_issues_get", "Get a single issue by number.", {
        type: "object",
        properties: {
            number: {
                type: "number",
                description: "The 'number' of the issue (not the id)",
            },
        },
        required: ["number"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var issue_number, context, _a, number, title, body, state, html_url, reactions, user, assignee;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    issue_number = args.number, context = args.context;
                    context.log("github issue get ".concat(issue_number));
                    return [4 /*yield*/, github.getIssue(issue_number)];
                case 1:
                    _a = _b.sent(), number = _a.number, title = _a.title, body = _a.body, state = _a.state, html_url = _a.html_url, reactions = _a.reactions, user = _a.user, assignee = _a.assignee;
                    return [2 /*return*/, YAML.stringify({
                            number: number,
                            title: title,
                            body: body,
                            state: state,
                            user: (user === null || user === void 0 ? void 0 : user.login) || "",
                            assignee: (assignee === null || assignee === void 0 ? void 0 : assignee.login) || "",
                            html_url: html_url,
                            reactions: reactions,
                        })];
            }
        });
    }); });
    defTool("github_issues_comments_list", "Get comments for an issue.", {
        type: "object",
        properties: {
            number: {
                type: "number",
                description: "The 'number' of the issue (not the id)",
            },
            count: {
                type: "number",
                description: "Number of comments to list. Default is 20.",
            },
        },
        required: ["number"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var issue_number, context, count, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    issue_number = args.number, context = args.context, count = args.count;
                    context.log("github issue list comments ".concat(issue_number));
                    return [4 /*yield*/, github.listIssueComments(issue_number, { count: count })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, CSV.stringify(res.map(function (_a) {
                            var id = _a.id, user = _a.user, body = _a.body, updated_at = _a.updated_at;
                            return ({
                                id: id,
                                user: (user === null || user === void 0 ? void 0 : user.login) || "",
                                body: body,
                                updated_at: updated_at,
                            });
                        }), { header: true })];
            }
        });
    }); });
}
