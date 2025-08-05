import type { ConfigArray } from "typescript-eslint";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
type ConfigExport = {
    recommended: FlatConfig.ConfigArray;
    recommendedTypeChecked: FlatConfig.ConfigArray;
    internal: ConfigArray;
};
declare const configExport: (plugin: FlatConfig.Plugin) => ConfigExport;
export default configExport;
//# sourceMappingURL=index.d.ts.map