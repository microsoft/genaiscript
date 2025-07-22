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
    title: "Vision Ask Image",
    description: "Register tool that uses vision model to run a query on images",
});
export default function (ctx) {
    var _this = this;
    var defTool = ctx.defTool;
    defTool("vision_ask_images", "Use vision model to run a query on multiple images", {
        type: "object",
        properties: {
            images: {
                type: "string",
                description: "Images URL or workspace relative filepaths. One image per line.",
            },
            extra: {
                type: "string",
                description: "Additional context information about the images",
            },
            query: {
                type: "string",
                description: "Query to run on the image",
            },
            hd: {
                type: "boolean",
                description: "Use high definition image",
            },
        },
        required: ["image", "query"],
    }, function (args) { return __awaiter(_this, void 0, void 0, function () {
        var context, images, extra, query, hd, imgs, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = args.context, images = args.images, extra = args.extra, query = args.query, hd = args.hd;
                    imgs = images.split(/\r?\n/g).filter(function (f) { return !!f; });
                    context.debug(imgs.join("\n"));
                    return [4 /*yield*/, runPrompt(function (_) {
                            _.defImages(imgs, {
                                autoCrop: true,
                                detail: hd ? "high" : "low",
                                maxWidth: hd ? 1024 : 512,
                                maxHeight: hd ? 1024 : 512,
                            });
                            if (extra)
                                _.def("EXTRA_CONTEXT", extra);
                            _.$(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Answer the <Query> about the images."], ["Answer the <Query> about the images."])));
                            if (extra)
                                $(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Use the extra context provided in <EXTRA_CONTEXT> to help you."], ["Use the extra context provided in <EXTRA_CONTEXT> to help you."])));
                            _.def("QUERY", query);
                        }, {
                            model: "vision",
                            cache: "vision_ask_images",
                            system: [
                                "system",
                                "system.assistant",
                                "system.safety_jailbreak",
                                "system.safety_harmful_content",
                            ],
                        })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res];
            }
        });
    }); });
}
var templateObject_1, templateObject_2;
