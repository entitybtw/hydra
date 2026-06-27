import { registerEvent } from "../register-event";
import { HydraApi } from "@main/services";
import { downloadSourcesSublevel } from "@main/level";
import axios from "axios";

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

const hydraApiCall = async (
  _event: Electron.IpcMainInvokeEvent,
  payload: HydraApiCallPayload
) => {
  const { method, url, data, params, options } = payload;

  const getErrorMessage = (error: unknown): string | null => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === "object" && error !== null) {
      const response = (
        error as { response?: { data?: { message?: unknown } } }
      ).response;
      const responseMessage = response?.data?.message;

      if (typeof responseMessage === "string") {
        return responseMessage;
      }
    }

    return null;
  };

  try {
    let request: Promise<unknown>;

    const isDownloadSourcesUrl = url.includes("/download-sources") && method === "get";
    const isCatalogueUrl = !isDownloadSourcesUrl && (
      url === "/catalogue/search" ||
      url.startsWith("/catalogue/") ||
      url === "/games/shop-details" ||
      url.startsWith("/games/steam/") ||
      url.startsWith("/games/launchbox/") ||
      (url.match(/^\/games\/[^/]+\/[^/]+\/(reviews|how-long-to-beat|protondb)/) !== null)
    );

    if (isDownloadSourcesUrl && HydraApi.useSelfHostedCatalogue) {
      const selfHostedUrl = HydraApi.getSelfHostedUrl();
      if (selfHostedUrl) {
        const sources = await downloadSourcesSublevel.values().all();
        const sourceUrls = sources.map((s) => s.url);
        request = axios.post(`${selfHostedUrl}${url}`, { sourceUrls }, { timeout: 15000 })
          .then((r) => r.data);
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
