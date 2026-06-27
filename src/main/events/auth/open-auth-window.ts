import i18next from "i18next";
import { registerEvent } from "../register-event";
import { HydraApi, WindowManager } from "@main/services";
import { AuthPage } from "@shared";
import { db } from "@main/level";
import { levelKeys } from "@main/level";
import type { UserPreferences } from "@types";

const openAuthWindow = async (
  _event: Electron.IpcMainInvokeEvent,
  page: AuthPage
) => {
  if (HydraApi.isSelfHosted()) {
    const prefs = await db.get<string, UserPreferences>(levelKeys.userPreferences, { valueEncoding: "json" }).catch(() => null);
    WindowManager.openSelfHostedAuthWindow(prefs?.selfHostedApiUrl ?? undefined);
    return;
  }

  const searchParams = new URLSearchParams({
    lng: i18next.language,
  });

  if ([AuthPage.UpdateEmail, AuthPage.UpdatePassword].includes(page)) {
    const { accessToken } = await HydraApi.refreshToken().catch(() => {
      return { accessToken: "" };
    });
    searchParams.set("token", accessToken);
  }

  WindowManager.openAuthWindow(page, searchParams);
};

registerEvent("openAuthWindow", openAuthWindow);
