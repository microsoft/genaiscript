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
    title: "File find files",
    description: "Find files with glob and content regex.",
});
export default function (ctx) {
    var _this = this;
    var env = ctx.env, defTool = ctx.defTool;
    var findFilesCount = env.vars.fsFindFilesCount || 64;
    defTool("fs_find_files", "Finds file matching a glob pattern. Use pattern to specify a regular expression to search for in the file content. Be careful about asking too many files.", {
        type: "object",
        properties: {
            glob: {
                type: "string",
                description: "Search path in glob format, including the relative path from the project root folder.",
            },
            pattern: {
                type: "string",
                description: "Optional regular expression pattern to search for in the file content.",
            },
            frontmatter: {
                type: "boolean",
                description: "If true, parse frontmatter in markdown files and return as YAML.",
            },
            count: {
                type: "number",
                description: "Number of files to return. Default is 20 maximum.",
            },
        },
        required: ["glob"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var glob, pattern, frontmatter, context, _a, count, res, _b, suffix, files, _i, res_1, filename, file, content, fm, e_1, preview, filenames;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    glob = args.glob, pattern = args.pattern, frontmatter = args.frontmatter, context = args.context, _a = args.count, count = _a === void 0 ? findFilesCount : _a;
                    context.log("ls ".concat(glob, " ").concat(pattern ? "| grep ".concat(pattern) : "", " ").concat(frontmatter ? "--frontmatter" : ""));
                    if (!pattern) return [3 /*break*/, 2];
                    return [4 /*yield*/, workspace.grep(pattern, { glob: glob, readText: false })];
                case 1:
                    _b = (_c.sent())
                        .files;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, workspace.findFiles(glob, { readText: false })];
                case 3:
                    _b = _c.sent();
                    _c.label = 4;
                case 4:
                    res = _b;
                    if (!(res === null || res === void 0 ? void 0 : res.length))
                        return [2 /*return*/, "No files found."];
                    suffix = "";
                    if (res.length > count) {
                        res = res.slice(0, count);
                        suffix =
                            "\n<too many files found. Showing first 100. Use 'count' to specify how many and/or use 'pattern' to do a grep search>";
                    }
                    if (!frontmatter) return [3 /*break*/, 12];
                    files = [];
                    _i = 0, res_1 = res;
                    _c.label = 5;
                case 5:
                    if (!(_i < res_1.length)) return [3 /*break*/, 11];
                    filename = res_1[_i].filename;
                    file = {
                        filename: filename,
                    };
                    files.push(file);
                    if (!/\.mdx?$/i.test(filename)) return [3 /*break*/, 10];
                    _c.label = 6;
                case 6:
                    _c.trys.push([6, 9, , 10]);
                    return [4 /*yield*/, workspace.readText(filename)];
                case 7:
                    content = _c.sent();
                    return [4 /*yield*/, parsers.frontmatter(content)];
                case 8:
                    fm = _c.sent();
                    if (fm)
                        file.frontmatter = fm;
                    return [3 /*break*/, 10];
                case 9:
                    e_1 = _c.sent();
                    return [3 /*break*/, 10];
                case 10:
                    _i++;
                    return [3 /*break*/, 5];
                case 11:
                    preview = files
                        .map(function (f) {
                        var _a;
                        return [f.filename, (_a = f.frontmatter) === null || _a === void 0 ? void 0 : _a.title]
                            .filter(function (p) { return !!p; })
                            .join(", ");
                    })
                        .join("\n");
                    context.log(preview);
                    return [2 /*return*/, YAML.stringify(files) + suffix];
                case 12:
                    filenames = res.map(function (f) { return f.filename; }).join("\n") + suffix;
                    context.log(filenames);
                    return [2 /*return*/, filenames];
            }
        });
    }); });
}
