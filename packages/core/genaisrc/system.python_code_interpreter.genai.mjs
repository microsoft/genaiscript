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
    title: "Python Dockerized code execution for data analysis",
    parameters: {
        image: {
            type: "string",
            description: "Docker image to use for python code execution",
            required: false,
        },
        packages: {
            type: "string",
            description: "Python packages to install in the container (comma separated)",
        },
    },
});
export default function (ctx) {
    var _this = this;
    var _a, _b;
    var defTool = ctx.defTool;
    var image = (_a = env.vars["system.python_code_interpreter.image"]) !== null && _a !== void 0 ? _a : "python:3.12";
    var packages = ((_b = env.vars["system.python_code_interpreter.packages"]) === null || _b === void 0 ? void 0 : _b.split(/\s*,\s*/g)) || [
        "numpy===2.1.3",
        "pandas===2.2.3",
        "scipy===1.14.1",
        "matplotlib===3.9.2",
    ];
    var getContainer = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, host.container({
                        name: "python",
                        persistent: true,
                        image: image,
                        postCreateCommands: "pip install --root-user-action ignore ".concat(packages.join(" ")),
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); };
    defTool("python_code_interpreter_run", "Executes python 3.12 code for Data Analysis tasks in a docker container. The process output is returned. Do not generate visualizations. The only packages available are numpy===2.1.3, pandas===2.2.3, scipy===1.14.1, matplotlib===3.9.2. There is NO network connectivity. Do not attempt to install other packages or make web requests. You must copy all the necessary files or pass all the data because the python code runs in a separate container.", {
        type: "object",
        properties: {
            main: {
                type: "string",
                description: "python 3.12 source code to execute",
            },
        },
        required: ["main"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, _a, main, container;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    context = args.context, _a = args.main, main = _a === void 0 ? "" : _a;
                    context.log("python: exec");
                    context.debug(main);
                    return [4 /*yield*/, getContainer()];
                case 1:
                    container = _b.sent();
                    return [4 /*yield*/, container.scheduler.add(function () { return __awaiter(_this, void 0, void 0, function () {
                            var res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, container.writeText("main.py", main)];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, container.exec("python", ["main.py"])];
                                    case 2:
                                        res = _a.sent();
                                        return [2 /*return*/, res];
                                }
                            });
                        }); })];
                case 2: return [2 /*return*/, _b.sent()];
            }
        });
    }); });
    defTool("python_code_interpreter_copy_files_to_container", "Copy files from the workspace file system to the container file system. NO absolute paths. Returns the path of each file copied in the python container.", {
        type: "object",
        properties: {
            from: {
                type: "string",
                description: "Workspace file path",
            },
            toFolder: {
                type: "string",
                description: "Container directory path. Default is '.'  Not a filename.",
            },
        },
        required: ["from"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, from, _a, toFolder, container, res;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    context = args.context, from = args.from, _a = args.toFolder, toFolder = _a === void 0 ? "." : _a;
                    context.log("python: cp ".concat(from, " ").concat(toFolder));
                    return [4 /*yield*/, getContainer()];
                case 1:
                    container = _b.sent();
                    return [4 /*yield*/, container.scheduler.add(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, container.copyTo(from, toFolder)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); })];
                case 2:
                    res = _b.sent();
                    return [2 /*return*/, res.join("\n")];
            }
        });
    }); });
    defTool("python_code_interpreter_read_file", "Reads a file from the container file system. No absolute paths.", {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "Container file path",
            },
        },
        required: ["filename"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, filename, container, res;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = args.context, filename = args.filename;
                    context.log("python: cat ".concat(filename));
                    return [4 /*yield*/, getContainer()];
                case 1:
                    container = _a.sent();
                    return [4 /*yield*/, container.scheduler.add(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, container.readText(filename)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); })];
                case 2:
                    res = _a.sent();
                    return [2 /*return*/, res];
            }
        });
    }); });
}
