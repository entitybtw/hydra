import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  VerticalFocusGroup,
} from "../../components";
import { useBigPictureToast, useUserPreferences } from "../../hooks";
import { SettingsSection } from "./settings-section";
import type { FocusOverrideTarget, FocusOverrides } from "../../services";

const FOCUS_CHECKBOX = "self-hosted-checkbox";
const FOCUS_URL = "self-hosted-url";
const FOCUS_TOKEN = "self-hosted-token";
const FOCUS_SAVE = "self-hosted-save";
const FOCUS_DASHBOARD = "self-hosted-dashboard";
const REGION = "self-hosted-region";

interface Props {
  upTarget: FocusOverrideTarget;
  downTarget: FocusOverrideTarget;
}

export function SelfHostedSection({ upTarget, downTarget }: Readonly<Props>) {
  const userPreferences = useUserPreferences();
  const { showSuccessToast, showErrorToast } = useBigPictureToast();

  const [enabled, setEnabled] = useState(false);
  const [form, setForm] = useState({ url: "", token: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userPreferences) return;
    setEnabled(
      Boolean(userPreferences.selfHostedApiUrl) &&
        Boolean(userPreferences.selfHostedApiToken)
    );
    setForm({
      url: userPreferences.selfHostedApiUrl ?? "",
      token: userPreferences.selfHostedApiToken ?? "",
    });
  }, [userPreferences]);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      await globalThis.window.electron.updateUserPreferences({
        selfHostedApiUrl: null,
        selfHostedApiToken: null,
        selfHostedUserToken: null,
      });
    }
  };

  const handleSave = async () => {
    if (!form.url || !form.token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${form.url}/auth/verify-instance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: form.token }),
      });
      if (!res.ok) throw new Error();
      await globalThis.window.electron.updateUserPreferences({
        selfHostedApiUrl: form.url,
        selfHostedApiToken: form.token,
      });
      showSuccessToast("Self-Hosted API connected", {
        fallbackVisual: "settings",
      });
    } catch {
      showErrorToast("Invalid token or server unreachable", {
        fallbackVisual: "settings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkboxNav = useMemo<FocusOverrides>(
    () => ({
      up: upTarget,
      down: enabled ? { type: "item", itemId: FOCUS_URL } : downTarget,
    }),
    [upTarget, downTarget, enabled]
  );

  const urlNav = useMemo<FocusOverrides>(
    () => ({
      up: { type: "item", itemId: FOCUS_CHECKBOX },
      down: { type: "item", itemId: FOCUS_TOKEN },
    }),
    []
  );

  const tokenNav = useMemo<FocusOverrides>(
    () => ({
      up: { type: "item", itemId: FOCUS_URL },
      right: { type: "item", itemId: FOCUS_SAVE },
      down: { type: "item", itemId: FOCUS_DASHBOARD },
    }),
    []
  );

  const saveNav = useMemo<FocusOverrides>(
    () => ({
      up: { type: "item", itemId: FOCUS_CHECKBOX },
      left: { type: "item", itemId: FOCUS_TOKEN },
      down: { type: "item", itemId: FOCUS_DASHBOARD },
    }),
    []
  );

  const dashNav = useMemo<FocusOverrides>(
    () => ({
      up: { type: "item", itemId: FOCUS_TOKEN },
      down: downTarget,
    }),
    [downTarget]
  );

  return (
    <SettingsSection
      title="Self-Hosted API"
      description="Connect to your own self-hosted Hydra backend for cloud saves, accounts, and profiles without a subscription."
      className="integration-provider-section"
    >
      <VerticalFocusGroup regionId={REGION} asChild>
        <div className="integration-provider-section__content">
          <Checkbox
            id="self-hosted-enabled"
            label="Enable Self-Hosted API"
            checked={enabled}
            focusId={FOCUS_CHECKBOX}
            navigationOverrides={checkboxNav}
            block
            onChange={handleToggle}
          />

          {enabled && (
            <>
              <Input
                id="self-hosted-url"
                label="Server URL"
                placeholder="http://localhost:3000"
                value={form.url}
                focusId={FOCUS_URL}
                focusNavigationOverrides={urlNav}
                autoComplete="off"
                onChange={(e) =>
                  setForm((p) => ({ ...p, url: e.target.value }))
                }
              />

              <div className="integration-provider-section__token-row">
                <Input
                  id="self-hosted-token"
                  label="Instance token"
                  type="password"
                  placeholder="API_TOKEN from .env"
                  value={form.token}
                  focusId={FOCUS_TOKEN}
                  focusNavigationOverrides={tokenNav}
                  autoComplete="off"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, token: e.target.value }))
                  }
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={isLoading}
                  disabled={!form.url || !form.token || isLoading}
                  focusId={FOCUS_SAVE}
                  focusNavigationOverrides={saveNav}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                focusId={FOCUS_DASHBOARD}
                focusNavigationOverrides={dashNav}
                onClick={() =>
                  globalThis.window.electron.openSelfHostedDashboard()
                }
              >
                Open Dashboard
              </Button>
            </>
          )}
        </div>
      </VerticalFocusGroup>
    </SettingsSection>
  );
}
