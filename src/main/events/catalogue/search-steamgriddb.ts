import { registerEvent } from "../register-event";
import { db, levelKeys } from "@main/level";
import type { UserPreferences } from "@types";
import axios from "axios";

const SGDB_BASE = "https://www.steamgriddb.com/api/v2";

const getApiKey = async (): Promise<string | null> => {
  const prefs = await db
    .get<string, UserPreferences | null>(levelKeys.userPreferences, {
      valueEncoding: "json",
    })
    .catch(() => null);
  return prefs?.steamGridDbApiKey ?? null;
};

const sgdbGet = async (path: string, apiKey: string) => {
  const { data } = await axios.get(`${SGDB_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return data;
};

const searchSteamGridDb = async (
  _event: Electron.IpcMainInvokeEvent,
  query: string,
  assetType: "icon" | "logo" | "hero",
  steamAppId?: string | null
): Promise<{ id: number; url: string; thumb: string }[]> => {
  const apiKey = await getApiKey();
  if (!apiKey) return [];

  try {
    let gameId: number | null = null;

    if (steamAppId) {
      const res = await sgdbGet(`/games/steam/${steamAppId}`, apiKey);
      if (res.success) gameId = res.data.id;
    }

    if (!gameId) {
      const res = await sgdbGet(
        `/search/autocomplete/${encodeURIComponent(query)}`,
        apiKey
      );
      if (res.success && res.data.length > 0) gameId = res.data[0].id;
    }

    if (!gameId) return [];

    const endpointMap = {
      icon: `/icons/game/${gameId}?types=png,ico`,
      logo: `/logos/game/${gameId}`,
      hero: `/heroes/game/${gameId}`,
    };

    const res = await sgdbGet(endpointMap[assetType], apiKey);
    if (!res.success) return [];

    return res.data.slice(0, 20).map((item: any) => ({
      id: item.id,
      url: item.url,
      thumb: item.thumb ?? item.url,
    }));
  } catch {
    return [];
  }
};

registerEvent("searchSteamGridDb", searchSteamGridDb);
