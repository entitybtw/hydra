import { net } from "electron";

const STEAM_SEARCH = "https://store.steampowered.com/api/storesearch";
const STEAM_DETAILS = "https://store.steampowered.com/api/appdetails";

const detailsCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 86_400_000; // 24h

async function fetchJson(url: string): Promise<any> {
  const res = await net.fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchSteamDetails(appId: string, lang = "english"): Promise<any> {
  const key = `${appId}:${lang}`;
  const cached = detailsCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  const url = `${STEAM_DETAILS}?appids=${appId}&l=${lang}&cc=us`;
  const json = await fetchJson(url).catch(() => null);
  const data = json?.[appId];
  if (data?.success) {
    detailsCache.set(key, { data: data.data, ts: Date.now() });
    return data.data;
  }
  return null;
}

function steamAsset(id: string, name: string, d?: any) {
  return {
    id: String(id),
    objectId: String(id),
    title: name,
    shop: "steam" as const,
    genres: (d?.genres ?? []).map((g: any) => g.description),
    releaseYear: d?.release_date?.date
      ? parseInt(d.release_date.date.split(",").pop()?.trim() ?? "0")
      : null,
    libraryImageUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
    coverImageUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900_2x.jpg`,
    downloadSources: [],
  };
}

export async function steamCatalogueSearch(body: any): Promise<any> {
  const { title = "", take = 20, skip = 0, genres: filterGenres = [] } = body ?? {};

  const pagesNeeded = Math.ceil((skip + take) / 10);
  const pages = Array.from({ length: Math.min(pagesNeeded, 5) }, (_, i) => i + 1);

  const pageResults = await Promise.all(pages.map(page =>
    fetchJson(`${STEAM_SEARCH}?term=${encodeURIComponent(title || "a")}&l=english&cc=us&json=1&page=${page}`)
      .then((r: any) => r?.items ?? [])
      .catch(() => [] as any[])
  ));

  const seen = new Set<string>();
  const items: any[] = [];
  for (const page of pageResults) {
    for (const item of page) {
      if (!seen.has(String(item.id))) { seen.add(String(item.id)); items.push(item); }
    }
  }

  const sliced = items.slice(skip, skip + take);
  const edges = await Promise.all(sliced.map(async (item: any) => {
    const d = await fetchSteamDetails(String(item.id)).catch(() => null);
    const asset = steamAsset(item.id, item.name, d);
    return asset;
  }));

  const filtered = filterGenres.length
    ? edges.filter(e => filterGenres.some((g: string) => e.genres.includes(g)))
    : edges;

  return { edges: filtered, count: items.length };
}

export async function steamShopDetails(body: any): Promise<any[]> {
  const { shop, objectIds = [] } = body ?? {};
  if (shop !== "steam") return [];

  const results = await Promise.all((objectIds as string[]).map(async (id) => {
    const d = await fetchSteamDetails(id).catch(() => null);
    if (!d) return null;
    return {
      objectId: id,
      shop: "steam",
      data: {
        title: d.name,
        description: d.detailed_description ?? d.short_description ?? "",
        releaseDate: d.release_date?.date ?? null,
        developers: d.developers ?? [],
        publishers: d.publishers ?? [],
        genres: (d.genres ?? []).map((g: any) => g.description),
        headerImage: d.header_image ?? null,
        website: d.website ?? null,
        screenshots: (d.screenshots ?? []).map((s: any) => s.path_full),
        assets: {
          objectId: id, shop: "steam", title: d.name, iconUrl: null,
          libraryHeroImageUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/library_hero.jpg`,
          libraryImageUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
          logoImageUrl: null,
        },
      },
    };
  }));
  return results.filter(Boolean) as any[];
}

export async function steamGameBasic(objectId: string, lang = "english"): Promise<any> {
  const d = await fetchSteamDetails(objectId, lang);
  if (!d) return null;
  const id = objectId;
  return {
    objectId: id, title: d.name, iconUrl: null,
    libraryHeroImageUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/library_hero.jpg`,
    libraryImageUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
    logoImageUrl: null, logoPosition: null,
    coverImageUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900_2x.jpg`,
    releaseDate: d.release_date?.date ?? null,
    releaseYear: d.release_date?.date ? parseInt(d.release_date.date.split(",").pop()?.trim() ?? "0") : null,
  };
}

export async function steamCatalogueCategory(category: string, take = 12): Promise<any[]> {
  const key = category === "hot" ? "top_sellers"
    : category === "weekly" ? "new_releases"
    : "specials";
  const json = await fetchJson("https://store.steampowered.com/api/featured").catch(() => null);
  const items: any[] = json?.[key]?.items ?? json?.featured_win ?? [];
  return items.slice(0, take).map((item: any) => steamAsset(item.id ?? item.appid, item.name));
}

export async function steamSearchSuggestions(query: string, limit = 5): Promise<any[]> {
  if (!query) return [];
  const json = await fetchJson(`${STEAM_SEARCH}?term=${encodeURIComponent(query)}&l=english&cc=us&json=1`).catch(() => null);
  const items: any[] = json?.items ?? [];
  return items.slice(0, limit).map((item: any) => ({
    title: item.name, objectId: String(item.id), shop: "steam", iconUrl: null,
  }));
}
