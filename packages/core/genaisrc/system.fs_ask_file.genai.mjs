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
    title: "File Ask File",
    description: "Run an LLM query against the content of a file.",
});
export default function (ctx) {
    var _this = this;
    var $ = ctx.$, defTool = ctx.defTool;
    defTool("fs_ask_file", "Runs a LLM query over the content of a file. Use this tool to extract information from a file.", {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "Path of the file to load, relative to the workspace.",
            },
            query: {
                type: "string",
                description: "Query to run over the file content.",
            },
        },
        required: ["filename"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var filename, query, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filename = args.filename, query = args.query;
                    if (!filename)
                        return [2 /*return*/, "MISSING_INFO: filename is missing"];
                    return [4 /*yield*/, workspace.readText(filename)];
                case 1:
                    file = _a.sent();
                    if (!file)
                        return [2 /*return*/, "MISSING_INFO: File not found"];
                    if (!file.content)
                        return [2 /*return*/, "MISSING_INFO: File content is empty or the format is not readable"];
                    return [4 /*yield*/, runPrompt(function (_) {
                            _.$(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Answer the QUERY with the content in FILE."], ["Answer the QUERY with the content in FILE."])));
                            _.def("FILE", file, { maxTokens: 28000 });
                            _.def("QUERY", query);
                            $(templateObject_2 || (templateObject_2 = __makeTemplateObject(["- Use the content in FILE exclusively to create your answer.\n                - If you are missing information, reply \"MISSING_INFO: <what is missing>\".\n                - If you cannot answer the query, return \"NO_ANSWER: <reason>\"."], ["- Use the content in FILE exclusively to create your answer.\n                - If you are missing information, reply \"MISSING_INFO: <what is missing>\".\n                - If you cannot answer the query, return \"NO_ANSWER: <reason>\"."])));
                        }, {
                            model: "small",
                            cache: "fs_ask_file",
                            label: "ask file ".concat(filename),
                            system: [
                                "system",
                                "system.explanations",
                                "system.safety_harmful_content",
                                "system.safety_protected_material",
                            ],
                        })];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    }); }, {
        maxTokens: 1000,
    });
}
var templateObject_1, templateObject_2;
