import { useEffect, useMemo, useState } from "react";
import { Button, Input, VerticalFocusGroup } from "../../components";
import { useBigPictureToast, useUserPreferences } from "../../hooks";
import { SettingsSection } from "./settings-section";
import type { FocusOverrideTarget, FocusOverrides } from "../../services";

const FOCUS_INPUT = "steamgriddb-input";
const FOCUS_SAVE = "steamgriddb-save";
const REGION = "steamgriddb-region";

interface Props {
  upTarget: FocusOverrideTarget;
  downTarget: FocusOverrideTarget;
}

export function SteamGridDbSection({ upTarget, downTarget }: Readonly<Props>) {
  const userPreferences = useUserPreferences();
  const { showSuccessToast } = useBigPictureToast();
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    setApiKey(userPreferences?.steamGridDbApiKey ?? "");
  }, [userPreferences]);

  const handleSave = async () => {
    await globalThis.window.electron.updateUserPreferences({
      steamGridDbApiKey: apiKey.trim() || null,
    });
    showSuccessToast("SteamGridDB API key saved", { fallbackVisual: "settings" });
  };

  const inputNav = useMemo<FocusOverrides>(
    () => ({
      up: upTarget,
      right: { type: "item", itemId: FOCUS_SAVE },
      down: downTarget,
    }),
    [upTarget, downTarget]
  );

  const saveNav = useMemo<FocusOverrides>(
    () => ({
      up: upTarget,
      left: { type: "item", itemId: FOCUS_INPUT },
      down: downTarget,
    }),
    [upTarget, downTarget]
  );

  return (
    <SettingsSection
      title="SteamGridDB"
      description="Set your SteamGridDB API key to browse and apply custom game art (icons, logos, heroes) from the game settings."
      className="integration-provider-section"
    >
      <VerticalFocusGroup regionId={REGION} asChild>
        <div className="integration-provider-section__content">
          <div className="integration-provider-section__token-row">
            <Input
              id="steamgriddb-key"
              label="API Key"
              type="password"
              placeholder="SteamGridDB API key"
              value={apiKey}
              focusId={FOCUS_INPUT}
              focusNavigationOverrides={inputNav}
              autoComplete="off"
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!apiKey.trim()}
              focusId={FOCUS_SAVE}
              focusNavigationOverrides={saveNav}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
          <p className="integration-provider-section__helper integration-provider-section__helper--idle">
            Get your API key at{" "}
            <a
              href="https://www.steamgriddb.com/profile/preferences/api"
              target="_blank"
              rel="noreferrer"
            >
              steamgriddb.com
            </a>
          </p>
        </div>
      </VerticalFocusGroup>
    </SettingsSection>
  );
}
