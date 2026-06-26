import { useTranslation } from "react-i18next";
import { SettingsDebrid } from "./settings-debrid";
import { SettingsSelfHosted } from "./settings-self-hosted";
import { SettingsSteamPresence } from "./settings-steam-presence";

export function SettingsContextIntegrations() {
  const { t } = useTranslation("settings");

  return (
    <div className="settings-context-panel">
      <div className="settings-context-panel__group">
        <h3>{t("debrid_services")}</h3>
        <SettingsDebrid />
      </div>

      <div className="settings-context-panel__group">
        <h3>{t("self_hosted_api")}</h3>
        <SettingsSelfHosted />
      </div>

      <div className="settings-context-panel__group">
        <h3>Steam</h3>
        <SettingsSteamPresence />
      </div>
    </div>
  );
}
