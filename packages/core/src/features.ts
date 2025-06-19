import { MODEL_PROVIDERS } from "./constants";

export function providerFeatures(provider: string) {
  const features = MODEL_PROVIDERS.find(({ id }) => id === provider);
  return features;
}
