import { ExtractResult } from ".";

export async function voe(url: string): Promise<ExtractResult> {
  const response = await request.get(url);

  const m3u8Url = response.text().match(/'hls': '([^']+)'/)![1];

  return {
    m3u8Url,
    subtitles: [],
  };
}
