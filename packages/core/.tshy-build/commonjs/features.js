"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerFeatures = providerFeatures;
const constants_js_1 = require("./constants.js");
function providerFeatures(provider) {
    const features = constants_js_1.MODEL_PROVIDERS.find(({ id }) => id === provider);
    return features;
}
//# sourceMappingURL=features.js.map