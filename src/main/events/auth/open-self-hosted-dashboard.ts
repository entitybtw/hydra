import { registerEvent } from "../register-event";
import { WindowManager } from "@main/services";
import { db } from "@main/level";
import { levelKeys } from "@main/level";
import type { UserPreferences } from "@types";

const openSelfHostedDashboard = async () => {
  const prefs = await db.get<string, UserPreferences>(levelKeys.userPreferences, { valueEncoding: "json" }).catch(() => null);
  const baseUrl = prefs?.selfHostedApiUrl;
  if (!baseUrl) return;
  const userToken = prefs?.selfHostedUserToken ?? null;
  WindowManager.openSelfHostedDashboard(baseUrl, userToken);
};

registerEvent("openSelfHostedDashboard", openSelfHostedDashboard);
