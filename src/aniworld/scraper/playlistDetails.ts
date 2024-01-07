export function scrapeSynopsis($: cheerio.Root) {
  const description = $("p.seri_des").attr("data-full-description");
  const cast = $("div.cast > ul > li")
    .toArray()
    .map((li) => {
      const title = $(li).find("strong").text().replace(":", "");
      const values = $(li)
        .find("ul > li span")
        .toArray()
        .map((value) => $(value).text());

      if (values.length === 0) {
        return undefined;
      }

      return `# ${title}\n${values.join(", ")}`;
    })
    .filter((cast) => cast !== undefined);

  return `${description}\n\n\n${cast.join("\n\n")}`;
}

export function scrapeGenres($: cheerio.Root) {
  const blacklist = ["GerSub", "GerDub", "Ger", "EngSub", "EngDub", "Eng"];

  return $("div.genres a")
    .toArray()
    .map((genre) => $(genre).text())
    .filter((genre) => !blacklist.includes(genre));
}
