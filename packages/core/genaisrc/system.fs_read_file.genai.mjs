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
    title: "File Read File",
    description: "Function to read file content as text.",
});
export default function (ctx) {
    var _this = this;
    var defTool = ctx.defTool;
    defTool("fs_read_file", "Reads a file as text from the file system. Returns undefined if the file does not exist.", {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "Path of the file to load, relative to the workspace.",
            },
            line: {
                type: "integer",
                description: "Line number (starting at 1) to read with a few lines before and after.",
            },
            line_start: {
                type: "integer",
                description: "Line number (starting at 1) to start reading from.",
            },
            line_end: {
                type: "integer",
                description: "Line number (starting at 1) to end reading at.",
            },
            line_numbers: {
                type: "boolean",
                description: "Whether to include line numbers in the output.",
            },
        },
        required: ["filename"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var filename, line, line_start, line_end, line_numbers, context, hasRange, content, res, e_1, lines, lines;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    filename = args.filename, line = args.line, line_start = args.line_start, line_end = args.line_end, line_numbers = args.line_numbers, context = args.context;
                    if (!filename)
                        return [2 /*return*/, "<MISSING>filename</MISSING>"];
                    if (!isNaN(line)) {
                        line_start = Math.max(1, line - 5);
                        line_end = Math.max(1, line + 5);
                    }
                    hasRange = !isNaN(line_start) && !isNaN(line_end);
                    if (hasRange) {
                        line_start = Math.max(1, line_start);
                        line_end = Math.max(1, line_end);
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    context.log("cat ".concat(filename).concat(hasRange ? " | sed -n '".concat(line_start, ",").concat(line_end, "p'") : ""));
                    return [4 /*yield*/, workspace.readText(filename)];
                case 2:
                    res = _b.sent();
                    content = (_a = res.content) !== null && _a !== void 0 ? _a : "";
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    return [2 /*return*/, "<FILE_NOT_FOUND>"];
                case 4:
                    if (line_numbers || hasRange) {
                        lines = content.split("\n");
                        content = lines
                            .map(function (line, i) { return "[".concat(i + 1, "] ").concat(line); })
                            .join("\n");
                    }
                    if (!isNaN(line_start) && !isNaN(line_end)) {
                        lines = content.split("\n");
                        content = lines.slice(line_start, line_end).join("\n");
                    }
                    return [2 /*return*/, content];
            }
        });
    }); }, {
        maxTokens: 10000,
    });
}
