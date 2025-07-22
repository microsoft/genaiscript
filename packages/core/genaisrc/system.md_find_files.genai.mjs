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
    title: "Tools to help with documentation tasks",
});
export default function (ctx) {
    var _this = this;
    var defTool = ctx.defTool;
    defTool("md_find_files", "Get the file structure of the documentation markdown/MDX files. Retursn filename, title, description for each match. Use pattern to specify a regular expression to search for in the file content.", {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "root path to search for markdown/MDX files",
            },
            pattern: {
                type: "string",
                description: "regular expression pattern to search for in the file content.",
            },
            question: {
                type: "string",
                description: "Question to ask when computing the summary",
            },
        },
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var path, pattern, context, question, matches, _a, q, files, res;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    path = args.path, pattern = args.pattern, context = args.context, question = args.question;
                    context.log("docs: ls ".concat(path, " ").concat(pattern ? "| grep ".concat(pattern) : "", " --frontmatter ").concat(question ? "--ask ".concat(question) : ""));
                    if (!pattern) return [3 /*break*/, 2];
                    return [4 /*yield*/, workspace.grep(pattern, { path: path, readText: true })];
                case 1:
                    _a = (_b.sent())
                        .files;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, workspace.findFiles(path + "/**/*.{md,mdx}", {
                        readText: true,
                    })];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    matches = _a;
                    if (!(matches === null || matches === void 0 ? void 0 : matches.length))
                        return [2 /*return*/, "No files found."];
                    return [4 /*yield*/, host.promiseQueue(5)];
                case 5:
                    q = _b.sent();
                    return [4 /*yield*/, q.mapAll(matches, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                            var file, fm, summary, e_1;
                            var filename = _b.filename, content = _b.content;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        file = {
                                            filename: filename,
                                        };
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 4, , 5]);
                                        return [4 /*yield*/, parsers.frontmatter(content)];
                                    case 2:
                                        fm = _c.sent();
                                        if (fm) {
                                            file.title = fm.title;
                                            file.description = fm.description;
                                        }
                                        return [4 /*yield*/, runPrompt(function (_) {
                                                _.def("CONTENT", content, {
                                                    language: "markdown",
                                                });
                                                _.$(templateObject_1 || (templateObject_1 = __makeTemplateObject(["As a professional summarizer, create a concise and comprehensive summary of the provided text, be it an article, post, conversation, or passage, while adhering to these guidelines:\n                        ", "\n                        * The summary is intended for an LLM, not a human.\n                        * Craft a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness.\n                        * Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.\n                        * Rely strictly on the provided text, without including external information.\n                        * Format the summary in one single paragraph form for easy understanding. Keep it short.\n                        * Generate a list of keywords that are relevant to the text."], ["As a professional summarizer, create a concise and comprehensive summary of the provided text, be it an article, post, conversation, or passage, while adhering to these guidelines:\n                        ", "\n                        * The summary is intended for an LLM, not a human.\n                        * Craft a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness.\n                        * Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.\n                        * Rely strictly on the provided text, without including external information.\n                        * Format the summary in one single paragraph form for easy understanding. Keep it short.\n                        * Generate a list of keywords that are relevant to the text."])), question ? "* ".concat(question) : "");
                                            }, {
                                                label: "summarize ".concat(filename),
                                                cache: "md_find_files_summary",
                                                model: "summarize",
                                            })];
                                    case 3:
                                        summary = (_c.sent()).text;
                                        file.summary = summary;
                                        return [3 /*break*/, 5];
                                    case 4:
                                        e_1 = _c.sent();
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/, file];
                                }
                            });
                        }); })];
                case 6:
                    files = _b.sent();
                    res = YAML.stringify(files);
                    return [2 /*return*/, res];
            }
        });
    }); }, { maxTokens: 20000 });
}
var templateObject_1;
