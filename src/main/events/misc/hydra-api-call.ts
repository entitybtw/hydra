import { registerEvent } from "../register-event";
import { HydraApi } from "@main/services";
import {
  steamCatalogueSearch,
  steamShopDetails,
  steamGameBasic,
  steamCatalogueCategory,
  steamSearchSuggestions,
} from "@main/services/steam-catalogue";

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

    const isReviewsUrl = url.match(/^\/games\/[^/]+\/[^/]+\/reviews/) !== null;
    const isHltbUrl = url.match(/^\/games\/[^/]+\/[^/]+\/how-long-to-beat/) !== null;
    const isProtondbUrl = url.match(/^\/games\/[^/]+\/[^/]+\/protondb/) !== null;
    const isGameDataUrl = isReviewsUrl || isHltbUrl || isProtondbUrl;

    const gameDataFlag = isReviewsUrl ? HydraApi.useSelfHostedReviews
      : isHltbUrl ? HydraApi.useSelfHostedHltb
      : HydraApi.useSelfHostedProtondb;

    // Steam catalogue — runs client-side via net.fetch, no self-hosted needed
    const steamIdMatch = url.match(/^\/games\/steam\/(\d+)$/);
    const categoryMatch = url.match(/^\/catalogue\/(hot|weekly|achievements)$/);

    if (HydraApi.useSelfHostedCatalogue) {
      if (url === "/catalogue/search" && method === "post") {
        request = steamCatalogueSearch(data);
      } else if (url === "/games/shop-details" && method === "post") {
        request = steamShopDetails(data);
      } else if (steamIdMatch) {
        const lang = (params as any)?.l ?? "english";
        request = steamGameBasic(steamIdMatch[1], lang);
      } else if (categoryMatch) {
        const take = parseInt((params as any)?.take ?? "12");
        request = steamCatalogueCategory(categoryMatch[1], take);
      } else if (url === "/catalogue/search/suggestions") {
        const q = (params as any)?.query ?? "";
        const limit = parseInt((params as any)?.limit ?? "5");
        request = steamSearchSuggestions(q, limit);
      } else {
        request = HydraApi.get(url, params, options);
      }
    } else if (isGameDataUrl && gameDataFlag) {
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
