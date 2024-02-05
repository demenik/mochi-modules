import AniWorld from "../aniworld";

export default class SerienStream extends AniWorld {
  constructor() {
    super("https://s.to");

    // keep version from aniworld
    this.metadata = {
      ...this.metadata,
      id: "serien-stream",
      name: "Serien Stream (s.to)",
      description: "Module to watch shows from s.to",
      icon: "https://s.to/favicon.ico",
    };
  }
}
