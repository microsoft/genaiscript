// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { MODEL_PROVIDERS } from "./constants.js";
export function providerFeatures(provider) {
    const features = MODEL_PROVIDERS.find(({ id }) => id === provider);
    return features;
}
//# sourceMappingURL=features.js.map