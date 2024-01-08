export async function voe(url: string): Promise<string> {
  const response = await request.get(url);

  return response.text().match(/'hls': '([^']+)'/)![1];
}
