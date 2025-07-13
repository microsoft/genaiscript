// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import processors from "./processors/index.js";
import rules from "./rules/index.js";
import * as constants from "./utils/constants.js";
import genaiscriptConfigs from "./configs/index.js";
const plugin = {
    meta: {
        name: constants.SDK_NAME,
        version: constants.SDK_VERSION,
    },
    processors,
    rules,
};
// assign configs here so we can reference `plugin`
const configs = genaiscriptConfigs(plugin);
function config(customConfigs) {
    return [
        ...configs.recommended,
        ...(customConfigs ?? [])
    ];
}
export default {
    ...plugin,
    configs,
    config,
};
//# sourceMappingURL=index.js.map