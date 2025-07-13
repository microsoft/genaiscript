// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

declare module "turndown-plugin-gfm" {
  // The GFM plugin typically exports an object with a 'gfm' property (the plugin function)
  export const gfm: Turndown.Plugin;
  // You can add more specific types if you know the shape, or just use 'any' for now
  const _default: { gfm: Turndown.Plugin };
  export default _default;
}
