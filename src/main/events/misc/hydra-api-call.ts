import { registerEvent } from "../register-event";
import { HydraApi } from "@main/services";
import { downloadSourcesSublevel } from "@main/level";
import { net } from "electron";

interface HydraApiCallPayload {
  method: "get" | "post" | "put" | "patch" | "delete";
  url: string;
  data?: unknown;
  params?: unknown;
  options?: {
    needsAuth?: boolean;
    needsSubscription?: boolean;
    ifModifiedSince?: Date;
  };
}

const sourceCache = new Map<string, { data: any[]; ts: number }>();
const SOURCE_TTL = 3600_000;

async function fetchSourceJson(sourceUrl: string): Promise<any[]> {
  const cached = sourceCache.get(sourceUrl);
  if (cached && Date.now() - cached.ts < SOURCE_TTL) return cached.data;
  const res = await net.fetch(sourceUrl);
  if (!res.ok) return [];
  const json = await res.json() as any;
  const data: any[] = Array.isArray(json) ? json : (json?.downloads ?? []);
  sourceCache.set(sourceUrl, { data, ts: Date.now() });
  return data;
}

function extractObjectId(url: string): string | null {
  const m = url.match(/\/games\/[^/]+\/([^/?]+)\/download-sources/);
  return m ? m[1] : null;
}

const hydraApiCall = async (
  _event: Electron.IpcMainInvokeEvent,
  payload: HydraApiCallPayload
) => {
  const { method, url, data, params, options } = payload;

  const getErrorMessage = (error: unknown): string | null => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "object" && error !== null) {
      const responseMessage = (error as any).response?.data?.message;
      if (typeof responseMessage === "string") return responseMessage;
    }
    return null;
  };

  try {
    let request: Promise<unknown>;

    const isDownloadSourcesUrl = url.includes("/download-sources") && method === "get";
    const isCatalogueUrl = !isDownloadSourcesUrl && (
      url === "/catalogue/search" ||
      url.match(/^\/catalogue\/(hot|weekly|achievements)$/) !== null ||
      url === "/catalogue/search/suggestions" ||
      url === "/games/shop-details" ||
      url.match(/^\/games\/steam\/\d+$/) !== null ||
      url.match(/^\/games\/launchbox\/[^/]+$/) !== null ||
      url.match(/^\/games\/[^/]+\/[^/]+\/(reviews|reviews\/check|how-long-to-beat|protondb)/) !== null
    );

    if (isDownloadSourcesUrl && HydraApi.useSelfHostedCatalogue) {
      const objectId = extractObjectId(url);
      if (objectId) {
        request = (async () => {
          const sources = await downloadSourcesSublevel.values().all();
          const results: any[] = [];
          await Promise.allSettled(sources.map(async (source) => {
            const entries = await fetchSourceJson(source.url).catch(() => [] as any[]);
            for (const entry of entries) {
              const entryId = String(entry.objectID ?? entry.objectId ?? entry.steam_appid ?? "");
              if (entryId !== objectId) continue;
              const uris: string[] = Array.isArray(entry.uris) ? entry.uris
                : Array.isArray(entry.magnetLinks) ? entry.magnetLinks
                : entry.magnet ? [entry.magnet]
                : entry.uri ? [entry.uri]
                : [];
              results.push({
                id: `${source.id}-${results.length}`,
                title: entry.title ?? entry.name ?? "",
                fileSize: entry.fileSize ?? entry.file_size ?? null,
                uris,
                unavailableUris: [],
                uploadDate: entry.uploadDate ?? entry.upload_date ?? null,
                downloadSourceId: source.id,
                downloadSourceName: source.name,
                createdAt: new Date().toISOString(),
              });
            }
          }));
          return results;
        })();
      } else {
        request = HydraApi.get(url, params, options);
      }
    } else if (isCatalogueUrl && HydraApi.useSelfHostedCatalogue) {
      if (method === "post") {
        request = HydraApi.cataloguePost(url, data);
      } else {
        request = HydraApi.catalogueGet(url, params);
      }
    } else {
      switch (method) {
        case "get":
          request = HydraApi.get(url, params, options);
          break;
        case "post":
          request = HydraApi.post(url, data, options);
          break;
        case "put":
          request = HydraApi.put(url, data, options);
          break;
        case "patch":
          request = HydraApi.patch(url, data, options);
          break;
        case "delete":
          request = HydraApi.delete(url, options);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    }

    return await request;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage ?? "hydra-api-call-failed");
  }
};

registerEvent("hydraApiCall", hydraApiCall);
