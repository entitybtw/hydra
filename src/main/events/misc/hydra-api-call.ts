import { registerEvent } from "../register-event";
import { HydraApi } from "@main/services";

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
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "object" && error !== null) {
      const msg = (error as any).response?.data?.message;
      if (typeof msg === "string") return msg;
    }
    return null;
  };

  try {
    let request: Promise<unknown>;

    const isGameDataUrl =
      url.match(/^\/games\/[^/]+\/[^/]+\/(reviews|how-long-to-beat|protondb)/) !== null;

    const isCatalogueUrl = !isGameDataUrl && (
      url === "/catalogue/search" ||
      url === "/games/shop-details" ||
      url.startsWith("/games/steam/") ||
      url.startsWith("/games/launchbox/")
    ) && !url.includes("/download-sources");

    if (isCatalogueUrl && HydraApi.useSelfHostedCatalogue) {
      request = method === "post"
        ? HydraApi.cataloguePost(url, data)
        : HydraApi.catalogueGet(url, params);
    } else if (isGameDataUrl && HydraApi.useSelfHostedGameData) {
      switch (method) {
        case "get": request = HydraApi.gameDataGet(url, params); break;
        case "post": request = HydraApi.gameDataPost(url, data); break;
        case "put": request = HydraApi.gameDataPut(url, data); break;
        case "delete": request = HydraApi.gameDataDelete(url); break;
        default: request = HydraApi.get(url, params, options);
      }
    } else {
      switch (method) {
        case "get": request = HydraApi.get(url, params, options); break;
        case "post": request = HydraApi.post(url, data, options); break;
        case "put": request = HydraApi.put(url, data, options); break;
        case "patch": request = HydraApi.patch(url, data, options); break;
        case "delete": request = HydraApi.delete(url, options); break;
        default: throw new Error(`Unsupported HTTP method: ${method}`);
      }
    }

    return await request;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage ?? "hydra-api-call-failed");
  }
};

registerEvent("hydraApiCall", hydraApiCall);
