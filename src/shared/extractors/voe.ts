import { ExtractorResult } from ".";

export async function voe(url: string): Promise<ExtractorResult> {
  const response = await request.get(url);

  return {
    url: response.text().match(/'hls': '([^']+)'/)![1],
  };
}
