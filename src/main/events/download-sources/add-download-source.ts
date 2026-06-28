import { registerEvent } from "../register-event";
import { HydraApi } from "@main/services/hydra-api";
import { downloadSourcesSublevel } from "@main/level";
import type { DownloadSource } from "@types";
import { logger } from "@main/services";
import { net } from "electron";
import crypto from "node:crypto";

const addDownloadSource = async (
  _event: Electron.IpcMainInvokeEvent,
  url: string
) => {
  try {
    const existingSources = await downloadSourcesSublevel.values().all();
    const urlExists = existingSources.some((source) => source.url === url);

    if (urlExists) {
      throw new Error("Download source with this URL already exists");
    }

    let downloadSource: DownloadSource;

    if (HydraApi.isSelfHostedAuthenticated()) {
      const response = await net.fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch source: ${response.status}`);
      const data = await response.json() as any;
      downloadSource = {
        id: crypto.randomUUID(),
        url,
        name: data.name ?? url,
        downloadCount: data.downloads?.length ?? 0,
        status: 1,
        createdAt: new Date().toISOString(),
      } as unknown as DownloadSource;
    } else {
      downloadSource = await HydraApi.post<DownloadSource>(
        "/download-sources",
        { url },
        { needsAuth: false }
      );
    }

    if (!HydraApi.isSelfHostedAuthenticated() && HydraApi.isLoggedIn() && HydraApi.hasActiveSubscription()) {
      try {
        await HydraApi.post("/profile/download-sources", { urls: [url] });
      } catch (error) {
        logger.error("Failed to add download source to profile:", error);
      }
    }

    await downloadSourcesSublevel.put(downloadSource.id, {
      ...downloadSource,
      isRemote: true,
      createdAt: new Date().toISOString(),
    });

    return downloadSource;
  } catch (error) {
    logger.error("Failed to add download source:", error);
    throw error;
  }
};

registerEvent("addDownloadSource", addDownloadSource);
