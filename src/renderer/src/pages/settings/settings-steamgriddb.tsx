import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, TextField } from "@renderer/components";
import { useAppSelector, useToast } from "@renderer/hooks";
import { settingsContext } from "@renderer/context";
import { LinkExternalIcon } from "@primer/octicons-react";

export function SettingsSteamGridDb() {
  const userPreferences = useAppSelector((state) => state.userPreferences.value);
  const { updateUserPreferences } = useContext(settingsContext);
  const { showSuccessToast, showErrorToast } = useToast();
  const { t } = useTranslation("settings");

  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setApiKey(userPreferences?.steamGridDbApiKey ?? "");
  }, [userPreferences]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUserPreferences({ steamGridDbApiKey: apiKey.trim() || null });
      showSuccessToast(t("changes_saved"));
    } catch {
      showErrorToast(t("try_again"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        {t("steamgriddb_description")}
        <a
          href="https://www.steamgriddb.com/profile/preferences/api"
          target="_blank"
          rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          steamgriddb.com <LinkExternalIcon size={12} />
        </a>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <TextField
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={t("steamgriddb_api_key_placeholder")}
          type="password"
          theme="dark"
        />
        <Button
          type="button"
          theme="outline"
          onClick={handleSave}
          disabled={isLoading}
        >
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
