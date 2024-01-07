export function scrapeAvailableLanguages($: cheerio.Root) {
  return $(".changeLanguageBox > img")
    .toArray()
    .map((img) => {
      const id = $(img)
        .attr("src")!
        .match(/\/([^./]+).svg/)![1];

      const langKey = $(img).attr("data-lang-key")!;

      return { id, langKey };
    });
}
