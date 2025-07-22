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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
system({
    description: "Video manipulation tools",
});
export default function (ctx) {
    var _this = this;
    var defTool = ctx.defTool;
    defTool("video_probe", "Probe a video file and returns the metadata information", {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename to probe",
            },
        },
        required: ["filename"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, filename, info;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = args.context, filename = args.filename;
                    if (!filename)
                        return [2 /*return*/, "No filename provided"];
                    return [4 /*yield*/, workspace.stat(filename)];
                case 1:
                    if (!(_a.sent()))
                        return [2 /*return*/, "File ".concat(filename, " does not exist.")];
                    context.log("probing ".concat(filename));
                    return [4 /*yield*/, ffmpeg.probe(filename)];
                case 2:
                    info = _a.sent();
                    return [2 /*return*/, YAML.stringify(info)];
            }
        });
    }); });
    defTool("video_extract_audio", "Extract audio from a video file into an audio file. Returns the audio filename.", {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename to probe",
            },
        },
        required: ["filename"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, filename, audioFile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = args.context, filename = args.filename;
                    if (!filename)
                        return [2 /*return*/, "No filename provided"];
                    return [4 /*yield*/, workspace.stat(filename)];
                case 1:
                    if (!(_a.sent()))
                        return [2 /*return*/, "File ".concat(filename, " does not exist.")];
                    context.log("extracting audio from ".concat(filename));
                    return [4 /*yield*/, ffmpeg.extractAudio(filename)];
                case 2:
                    audioFile = _a.sent();
                    return [2 /*return*/, audioFile];
            }
        });
    }); });
    defTool("video_extract_clip", "Extract a clip from from a video file. Returns the video filename.", {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename to probe",
            },
            start: {
                type: ["number", "string"],
                description: "The start time in seconds or HH:MM:SS",
            },
            duration: {
                type: ["number", "string"],
                description: "The duration in seconds",
            },
            end: {
                type: ["number", "string"],
                description: "The end time in seconds or HH:MM:SS",
            },
        },
        required: ["filename", "start"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, filename, start, end, duration, audioFile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = args.context, filename = args.filename, start = args.start, end = args.end, duration = args.duration;
                    if (!filename)
                        return [2 /*return*/, "No filename provided"];
                    return [4 /*yield*/, workspace.stat(filename)];
                case 1:
                    if (!(_a.sent()))
                        return [2 /*return*/, "File ".concat(filename, " does not exist.")];
                    context.log("extracting clip from ".concat(filename));
                    return [4 /*yield*/, ffmpeg.extractClip(filename, {
                            start: start,
                            end: end,
                            duration: duration,
                        })];
                case 2:
                    audioFile = _a.sent();
                    return [2 /*return*/, audioFile];
            }
        });
    }); });
    defTool("video_extract_frames", "Extract frames from a video file", {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename to probe",
            },
            keyframes: {
                type: "boolean",
                description: "Extract keyframes only",
            },
            sceneThreshold: {
                type: "number",
                description: "The scene threshold to use",
                default: 0.3,
            },
            count: {
                type: "number",
                description: "The number of frames to extract",
                default: -1,
            },
            timestamps: {
                type: "string",
                description: "A comma separated-list of timestamps.",
            },
            transcription: {
                type: "boolean",
                description: "Extract frames at each transcription segment",
            },
        },
        required: ["filename"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, filename, transcription, options, _a, videoFrames;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    context = args.context, filename = args.filename, transcription = args.transcription, options = __rest(args, ["context", "filename", "transcription"]);
                    if (!filename)
                        return [2 /*return*/, "No filename provided"];
                    return [4 /*yield*/, workspace.stat(filename)];
                case 1:
                    if (!(_b.sent()))
                        return [2 /*return*/, "File ".concat(filename, " does not exist.")];
                    context.log("extracting frames from ".concat(filename));
                    if (!transcription) return [3 /*break*/, 3];
                    _a = options;
                    return [4 /*yield*/, transcribe(filename, {
                            cache: "transcribe",
                        })];
                case 2:
                    _a.transcription = _b.sent();
                    _b.label = 3;
                case 3:
                    if (typeof options.timestamps === "string")
                        options.timestamps = options.timestamps
                            .split(",")
                            .filter(function (t) { return !!t; });
                    return [4 /*yield*/, ffmpeg.extractFrames(filename, options)];
                case 4:
                    videoFrames = _b.sent();
                    return [2 /*return*/, videoFrames.join("\n")];
            }
        });
    }); });
}
