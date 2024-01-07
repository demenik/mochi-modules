// ripped from https://github.com/Nixuge/mochis/blob/main/src/shared/utils/m3u8.ts
// slightly modified to work without his Interfaces (java coders xDDD)

import {
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerLink,
  PlaylistEpisodeServerQualityType,
} from "@mochiapp/js";

// Note: this regex gets the vertical resolution only, only thing we need for the quality enum.
const M3U8_PATTERN = /#EXT-X-STREAM-INF:[^\n]*RESOLUTION=\d+x(\d+)[^\n]*\n([^\n]+)/g;

export type M3u8Opts = {
  keepAuto?: boolean;
  customPattern?: RegExp;
  headers?: Record<string, string>;
};

export async function getM3u8Qualities(
  mainFileUrl: string,
  opts: M3u8Opts = {}
): Promise<PlaylistEpisodeServerLink[]> {
  const usedPattern = opts.customPattern ? opts.customPattern : M3U8_PATTERN;

  const urlSplit = mainFileUrl.split("/");
  const baseDomain = urlSplit.slice(0, 3).join("/") + "/";
  urlSplit.pop();
  const baseUrl = urlSplit.join("/") + "/";

  const sources: PlaylistEpisodeServerLink[] = [];
  if (opts.keepAuto === undefined || opts.keepAuto) {
    sources.push({
      url: mainFileUrl,
      quality: PlaylistEpisodeServerQualityType.auto,
      format: PlaylistEpisodeServerFormatType.hsl,
    } satisfies PlaylistEpisodeServerLink);
  }

  let m3u8Data: string = "";
  try {
    m3u8Data = await request
      .get(mainFileUrl, { headers: opts.headers })
      .then((resp) => resp.text());
  } catch (e) {
    throw Error("error grabbing m3u8data for url '" + mainFileUrl + "': " + e);
  }

  const m3u8Sources = m3u8Data.matchAll(usedPattern);

  for (const m3u8Source of m3u8Sources) {
    const size = m3u8Source[1];
    let url = m3u8Source[2];

    if (url.startsWith("/")) {
      url = baseDomain + url;
    } else if (url.startsWith("https://") || url.startsWith("http://")) {
      url = url; // do nothing, just for clarity reasons
    } else {
      url = baseUrl + url;
    }

    const quality =
      PlaylistEpisodeServerQualityType[
        `q${size}p` as keyof typeof PlaylistEpisodeServerQualityType
      ];

    sources.push({
      url: url,
      quality,
      format: PlaylistEpisodeServerFormatType.hsl,
    } satisfies PlaylistEpisodeServerLink);
  }
  return sources;
}
