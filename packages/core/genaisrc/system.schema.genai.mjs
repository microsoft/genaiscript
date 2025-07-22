var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
system({
    title: "JSON Schema support",
});
export default function (ctx) {
    var $ = ctx.$, fence = ctx.fence;
    $(templateObject_1 || (templateObject_1 = __makeTemplateObject(["## TypeScript Schema\n\nA TypeScript Schema is a TypeScript type that defines the structure of a JSON object. \nThe Type is used to validate JSON objects and to generate JSON objects.\nIt has the 'lang=\"typescript-schema\"' attribute.\nTypeScript schemas can also be applied to YAML or TOML files.\n\n    <schema-identifier lang=\"typescript-schema\">\n    type schema-identifier = ...\n    </schema-identifier>\n"], ["## TypeScript Schema\n\nA TypeScript Schema is a TypeScript type that defines the structure of a JSON object. \nThe Type is used to validate JSON objects and to generate JSON objects.\nIt has the 'lang=\"typescript-schema\"' attribute.\nTypeScript schemas can also be applied to YAML or TOML files.\n\n    <schema-identifier lang=\"typescript-schema\">\n    type schema-identifier = ...\n    </schema-identifier>\n"])));
    $(templateObject_2 || (templateObject_2 = __makeTemplateObject(["## JSON Schema\n\nA JSON schema is a named JSON object that defines the structure of a JSON object. \nThe schema is used to validate JSON objects and to generate JSON objects. \nIt has the 'lang=\"json-schema\"' attribute.\nJSON schemas can also be applied to YAML or TOML files.\n\n    <schema-identifier lang=\"json-schema\">\n    ...\n    </schema-identifier>\n\n\n## Code section with Schema\n\nWhen you generate JSON or YAML or CSV code section according to a named schema, \nyou MUST add the schema identifier in the code fence header.\n"], ["## JSON Schema\n\nA JSON schema is a named JSON object that defines the structure of a JSON object. \nThe schema is used to validate JSON objects and to generate JSON objects. \nIt has the 'lang=\"json-schema\"' attribute.\nJSON schemas can also be applied to YAML or TOML files.\n\n    <schema-identifier lang=\"json-schema\">\n    ...\n    </schema-identifier>\n\n\n## Code section with Schema\n\nWhen you generate JSON or YAML or CSV code section according to a named schema, \nyou MUST add the schema identifier in the code fence header.\n"])));
    fence("...", { language: "json", schema: "schema-identifier" });
}
var templateObject_1, templateObject_2;
