import { ExtractorResult } from ".";

export async function voe(url: string): Promise<ExtractorResult> {
  const res = await request.get(url);
  const html = res.text();
  const providerUrl = html.match(/window\.location\.href = '([^']*)'/)![1];

  const response = await request.get(providerUrl);

  return {
    url: response.text().match(/'hls': '([^']+)'/)![1],
  };
}
