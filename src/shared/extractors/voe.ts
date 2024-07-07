import { ExtractorResult } from ".";

export async function voe(url: string): Promise<ExtractorResult> {
  const res = await request.get(url);
  const html = res.text();
  const providerUrl = html.match(/window\.location\.href = '([^']*)'/)![1];

  const response = await request.get(providerUrl);
  const hlsUrl = response.text().match(/prompt\("Node", "([^"]+)"\)/)![1];

  return {
    url: hlsUrl,
  };
}
