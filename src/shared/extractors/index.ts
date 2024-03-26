import { voe } from "./voe";

export const extractors: Record<string, (url: string) => Promise<ExtractorResult>> = {
  voe,
};

export type ExtractorId = keyof typeof extractors;

export type ExtractorResult = {
  url: string;
  headers?: Record<string, string>;
};

export function extract(url: string, provider: ExtractorId) {
  const extractor = extractors[provider];
  if (!extractor) throw new Error(`No extractor for provider ${provider}`);
  return extractor(url);
}
