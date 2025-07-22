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
    title: "github workflows",
    description: "Queries results from workflows in GitHub actions. Prefer using diffs to compare logs.",
});
export default function (ctx) {
    var _this = this;
    var defTool = ctx.defTool;
    defTool("github_actions_workflows_list", "List all github workflows.", {}, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = args.context;
                    context.log("github action list workflows");
                    return [4 /*yield*/, github.listWorkflows()];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, CSV.stringify(res.map(function (_a) {
                            var id = _a.id, name = _a.name, path = _a.path;
                            return ({ id: id, name: name, path: path });
                        }), { header: true })];
            }
        });
    }); });
    defTool("github_actions_runs_list", "List all runs for a workflow or the entire repository. \n    - Use 'git_actions_list_workflows' to list workflows. \n    - Omit 'workflow_id' to list all runs.\n    - head_sha is the commit hash.", {
        type: "object",
        properties: {
            workflow_id: {
                type: "string",
                description: "ID or filename of the workflow to list runs for. Empty lists all runs.",
            },
            branch: {
                type: "string",
                description: "Branch to list runs for.",
            },
            status: {
                type: "string",
                enum: ["success", "failure"],
                description: "Filter runs by completion status",
            },
            count: {
                type: "number",
                description: "Number of runs to list. Default is 20.",
            },
        },
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var workflow_id, branch, status, context, count, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    workflow_id = args.workflow_id, branch = args.branch, status = args.status, context = args.context, count = args.count;
                    context.log("github action list ".concat(status || "", " runs for ").concat(workflow_id ? "workflow ".concat(workflow_id) : "repository", " and branch ").concat(branch || "all"));
                    return [4 /*yield*/, github.listWorkflowRuns(workflow_id, {
                            branch: branch,
                            status: status,
                            count: count,
                        })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, CSV.stringify(res.map(function (_a) {
                            var id = _a.id, name = _a.name, conclusion = _a.conclusion, head_sha = _a.head_sha;
                            return ({
                                id: id,
                                name: name,
                                conclusion: conclusion,
                                head_sha: head_sha,
                            });
                        }), { header: true })];
            }
        });
    }); });
    defTool("github_actions_jobs_list", "List all jobs for a github workflow run.", {
        type: "object",
        properties: {
            run_id: {
                type: "string",
                description: "ID of the run to list jobs for. Use 'git_actions_list_runs' to list runs for a workflow.",
            },
        },
        required: ["run_id"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var run_id, context, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    run_id = args.run_id, context = args.context;
                    context.log("github action list jobs for run ".concat(run_id));
                    return [4 /*yield*/, github.listWorkflowJobs(run_id)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, CSV.stringify(res.map(function (_a) {
                            var id = _a.id, name = _a.name, conclusion = _a.conclusion;
                            return ({
                                id: id,
                                name: name,
                                conclusion: conclusion,
                            });
                        }), { header: true })];
            }
        });
    }); });
    defTool("github_actions_job_logs_get", "Download github workflow job log. If the log is too large, use 'github_actions_job_logs_diff' to compare logs.", {
        type: "object",
        properties: {
            job_id: {
                type: "string",
                description: "ID of the job to download log for.",
            },
        },
        required: ["job_id"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var job_id, context, log, annotations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    job_id = args.job_id, context = args.context;
                    context.log("github action download job log ".concat(job_id));
                    return [4 /*yield*/, github.downloadWorkflowJobLog(job_id, {
                            llmify: true,
                        })];
                case 1:
                    log = _a.sent();
                    return [4 /*yield*/, tokenizers.count(log)];
                case 2:
                    if (!((_a.sent()) > 1000)) return [3 /*break*/, 5];
                    return [4 /*yield*/, tokenizers.truncate(log, 1000, { last: true })];
                case 3:
                    log = _a.sent();
                    return [4 /*yield*/, parsers.annotations(log)];
                case 4:
                    annotations = _a.sent();
                    if (annotations.length > 0)
                        log += "\n\n" + YAML.stringify(annotations);
                    _a.label = 5;
                case 5: return [2 /*return*/, log];
            }
        });
    }); });
    defTool("github_actions_job_logs_diff", "Diffs two github workflow job logs.", {
        type: "object",
        properties: {
            job_id: {
                type: "string",
                description: "ID of the job to compare.",
            },
            other_job_id: {
                type: "string",
                description: "ID of the other job to compare.",
            },
        },
        required: ["job_id", "other_job_id"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var job_id, other_job_id, context, log;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    job_id = args.job_id, other_job_id = args.other_job_id, context = args.context;
                    context.log("github action diff job logs ".concat(job_id, " ").concat(other_job_id));
                    return [4 /*yield*/, github.diffWorkflowJobLogs(job_id, other_job_id)];
                case 1:
                    log = _a.sent();
                    return [2 /*return*/, log];
            }
        });
    }); });
}
