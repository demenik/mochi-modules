import {
  DiscoverListing,
  Paging,
  Playlist,
  PlaylistDetails,
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerQualityType,
  PlaylistEpisodeServerRequest,
  PlaylistEpisodeServerResponse,
  PlaylistEpisodeSource,
  PlaylistEpisodeSourcesRequest,
  PlaylistGroup,
  PlaylistGroupVariant,
  PlaylistItem,
  PlaylistItemsOptions,
  PlaylistItemsResponse,
  PlaylistStatus,
  PlaylistType,
  SearchFilter,
  SearchQuery,
  SourceModule,
  VideoContent,
} from "@mochiapp/js";

import * as cheerio from "cheerio";

type ItemToFetch = {
    playlist: Playlist,
    promise: Promise<(string | undefined)[]>
}

export default class AniWorld extends SourceModule implements VideoContent {
  static BASE_URL = "https://aniworld.to";
  static AJAX_URL = "https://aniworld.to/ajax";

  metadata = {
    id: "aniworld",
    name: "AniWorld",
    description: "Module to stream AniWorld.to",
    icon: `${AniWorld.BASE_URL}/favicon.ico`,
    version: "0.0.1",
  };

  async searchFilters(): Promise<SearchFilter[]> {
    return [];
  }



  async search(query: SearchQuery): Promise<Paging<Playlist>> {
    const response = await request.post(`${AniWorld.AJAX_URL}/search`, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: `keyword=${encodeURIComponent(query.query)}`,
    });

    const data = response.json<AJAXSearchResult[]>();
    let items: ItemToFetch[] = []

    for (const item of data) {
      if (!item.link.startsWith("/anime/stream/")) continue;

      const playlistId = item.link.split("/")[3];
      if (items.find((item) => item.playlist.id === playlistId)) continue;

      items.push({
        promise: getImages(playlistId),
        playlist: {
          id: playlistId,
          title: item.title.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&"),
          url: `${AniWorld.BASE_URL}/anime/stream/${playlistId}`,
          status: PlaylistStatus.unknown,
          type: PlaylistType.video,
      }});
    }

    const playlists: Playlist[] = []
    for (const item of items) {
      const itemPlaylist = item.playlist;
      [itemPlaylist.posterImage, itemPlaylist.bannerImage] = await item.promise;
      playlists.push(itemPlaylist);
    }
    
    return {
      id: "",
      nextPage: undefined,
      previousPage: undefined,
      items: playlists,
    };
  }

  async discoverListings(): Promise<DiscoverListing[]> {
    return [];
  }

  async playlistDetails(playlistId: string): Promise<PlaylistDetails> {
    const response = await request.get(`${AniWorld.BASE_URL}/anime/stream/${playlistId}`);
    const $ = cheerio.load(response.text());

    return {
      synopsis: $(".seri_des").attr("data-full-description"),
      altTitles: [],
      altPosters: [],
      altBanners: [],
      genres: $(".genres > ul > li > a")
        .toArray()
        .map((item) => $(item).text())
        .filter((genre) => !["Ger", "GerSub"].includes(genre)),
      yearReleased: parseInt($(".series-title span[itemprop='startDate'] > a").text()),
      ratings: undefined,
      previews: [],
    };
  }

  async playlistEpisodes(
    playlistId: string,
    options?: PlaylistItemsOptions
  ): Promise<PlaylistItemsResponse> {
    const response = await request.get(
      `${AniWorld.BASE_URL}/anime/stream/${playlistId}/${options?.groupId || ""}`
    );
    const $ = cheerio.load(response.text());

    const variants = getVariants($);

    const variantsWithEpisodes = variants.map((variant) => ({
      ...variant,
      pagings: [
        {
          id: "",
          nextPage: undefined,
          previousPage: undefined,
          title: "",
          items: getEpisodes($, variant.id),
        },
      ],
    }));
    const selectedGroup = $("#stream > ul:first > li > a.active").attr("href")!.split("/").at(-1)!;

    const groups: PlaylistGroup[] = $("#stream > ul:first > li > a")
      .toArray()
      .map((item, idx) => {
        const groupId = $(item).attr("href")!.split("/").at(-1)!;
        const groupName = $(item).attr("title");

        return {
          id: groupId,
          number: idx,
          altTitle: groupName,
          variants: groupId === selectedGroup ? variantsWithEpisodes : variants,
        };
      })
      .sort((a, b) => {
        if (a.id === "filme") return 1;
        if (b.id === "filme") return -1;
        return a.number - b.number;
      });

    return groups;
  }

  async playlistEpisodeSources(
    req: PlaylistEpisodeSourcesRequest
  ): Promise<PlaylistEpisodeSource[]> {
    const [groupId, episodeId, variantId] = req.episodeId.split("/");

    const response = await request.get(
      `${AniWorld.BASE_URL}/anime/stream/${req.playlistId}/${groupId}/${episodeId}`
    );
    const $ = cheerio.load(response.text());

    const langId = convertVariantToLangId($, variantId);

    const sources = [
      {
        id: "aniworld",
        displayName: "AniWorld",
        servers: $(".hosterSiteVideo > .row > li")
          .toArray()
          .filter((item) => $(item).attr("data-lang-key") === langId)
          .map((item) => {
            const redirectId = $(item).attr("data-link-id")!;
            const serverName = $(item).find("h4").text();

            return {
              id: `${serverName}/${redirectId}`,
              displayName: serverName,
            };
          })
          .filter((server) => servers.has(server.displayName)),
      },
    ];

    return sources;
  }

  async playlistEpisodeServer(
    req: PlaylistEpisodeServerRequest
  ): Promise<PlaylistEpisodeServerResponse> {
    const [serverId, redirectId] = req.serverId.split("/");

    return {
      links: [
        {
          url: await servers.get(serverId)!(redirectId)!,
          quality: PlaylistEpisodeServerQualityType.q720p,
          format: PlaylistEpisodeServerFormatType.hsl,
        },
      ],
      subtitles: [],
      skipTimes: [],
      headers: {},
    };
  }
}

type AJAXSearchResult = {
  title: string;
  link: string;
  description: string;
};

const getImages = async (playlistId: string) => {
  const response = await request.get(`${AniWorld.BASE_URL}/anime/stream/${playlistId}`);
  const $ = cheerio.load(response.text());

  const poster = $(".seriesCoverBox > img").attr("data-src");
  const banner = $(".backdrop")
    .attr("style")
    ?.match(/url\(([^"]+)\)/)?.[1];

  return [
    poster ? `${AniWorld.BASE_URL}${poster}` : undefined,
    banner ? `${AniWorld.BASE_URL}${banner}` : undefined,
  ];
};

const variantTitles = new Map(
  Object.entries({
    german: "Deutsch",
    japanese: "Japanisch",
    english: "Englisch",
    "japanese-german": "Japanisch mit deutschen Untertiteln",
    "japanese-english": "Japanisch mit englischen Untertiteln",
  })
);

const getVariants = ($: cheerio.Root) => {
  const variants: PlaylistGroupVariant[] = $(".editFunctions:first img")
    .toArray()
    .map((item) => {
      const variantId = $(item).attr("src")!.split("/").at(-1)!.split(".")[0]!;

      return {
        id: variantId,
        title: variantTitles.get(variantId) || variantId,
        pagings: undefined,
      };
    })
    .sort((a, b) => {
      if (a.id === "japanese-german") return -1;
      if (b.id === "japanese-german") return 1;
      return 0;
    });

  return variants;
};

const getEpisodes = ($: cheerio.Root, variantId: string) => {
  const episodes: PlaylistItem[] = $(".seasonEpisodesList > tbody > tr")
    .toArray()
    .map((item) => {
      const episodeId = $(item).find("a").attr("href")!.split("/").slice(-2).join("/");
      const title = $(item).find(".seasonEpisodeTitle strong").text();
      const altTitle = $(item).find(".seasonEpisodeTitle span").text();

      return {
        id: `${episodeId}/${variantId}`,
        title: title || altTitle,
        thumbnail: undefined, // TODO
        number: parseInt($(item).attr("data-episode-season-id")!),
        tags: [],
      };
    });

  return episodes;
};

const convertVariantToLangId = ($: cheerio.Root, variantId: string) => {
  return $(`.changeLanguageBox > img[src='/public/img/${variantId}.svg']`).attr("data-lang-key");
};

const servers = new Map(
  Object.entries({
    VOE: async (serverId: string) => {
      const response = await request.get(`${AniWorld.BASE_URL}/redirect/${serverId}`);
      return response.text().match(/'hls': '([^']+)'/)?.[1]!;
    },
  })
);
