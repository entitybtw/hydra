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

const F = {
  CHECKBOX: "self-hosted-checkbox",
  URL: "self-hosted-url",
  TOKEN: "self-hosted-token",
  SAVE: "self-hosted-save",
  DASHBOARD: "self-hosted-dashboard",
  IMPORT: "self-hosted-import",
  CATALOGUE: "self-hosted-catalogue",
  REVIEWS: "self-hosted-reviews",
  HLTB: "self-hosted-hltb",
  PROTONDB: "self-hosted-protondb",
  SIGN_OUT: "self-hosted-signout",
  SELF_SIGN_OUT: "self-hosted-self-signout",
  SESSION: "self-hosted-session",
};

interface Props {
  upTarget: FocusOverrideTarget;
  downTarget: FocusOverrideTarget;
}

export function SelfHostedSection({ upTarget, downTarget }: Readonly<Props>) {
  const userPreferences = useUserPreferences();
  const { showSuccessToast, showErrorToast } = useBigPictureToast();
  const opts = { fallbackVisual: "settings" as const };

  const [enabled, setEnabled] = useState(false);
  const [form, setForm] = useState({ url: "", token: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!userPreferences) return;
    setEnabled(Boolean(userPreferences.selfHostedApiUrl && userPreferences.selfHostedApiToken));
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
      showSuccessToast("Self-Hosted API connected", opts);
    } catch {
      showErrorToast("Invalid token or server unreachable", opts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await (globalThis.window.electron as any).openHydraCloudImport();
      showSuccessToast(`Imported ${result.imported} games, ${result.achievements} achievements`, opts);
    } catch (err: any) {
      if (err?.message !== "cancelled") showErrorToast("Import failed", opts);
    } finally {
      setImporting(false);
    }
  };

  const pref = (key: string, value: boolean | number) =>
    globalThis.window.electron.updateUserPreferences({ [key]: value });

  // nav helpers
  const nav = (up: string | FocusOverrideTarget, down: string | FocusOverrideTarget, extra?: Partial<FocusOverrides>): FocusOverrides => ({
    up: typeof up === "string" ? { type: "item", itemId: up } : up,
    down: typeof down === "string" ? { type: "item", itemId: down } : down,
    ...extra,
  });

  const checkboxNav = useMemo<FocusOverrides>(
    () => ({ up: upTarget, down: enabled ? { type: "item", itemId: F.URL } : downTarget }),
    [upTarget, downTarget, enabled]
  );

  // last optional item chains down to downTarget
  const lastOptionalNav = useMemo<FocusOverrides>(
    () => nav(F.SESSION, downTarget),
    [downTarget]
  );

  if (!enabled) {
    return (
      <SettingsSection
        title="Self-Hosted API"
        description="Connect to your own self-hosted Hydra backend for cloud saves, accounts, and profiles without a subscription."
        className="integration-provider-section"
      >
        <VerticalFocusGroup regionId="self-hosted-region" asChild>
          <div className="integration-provider-section__content">
            <Checkbox
              id="self-hosted-enabled"
              label="Enable Self-Hosted API"
              checked={false}
              focusId={F.CHECKBOX}
              navigationOverrides={checkboxNav}
              block
              onChange={handleToggle}
            />
          </div>
        </VerticalFocusGroup>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Self-Hosted API"
      description="Connect to your own self-hosted Hydra backend for cloud saves, accounts, and profiles without a subscription."
      className="integration-provider-section"
    >
      <VerticalFocusGroup regionId="self-hosted-region" asChild>
        <div className="integration-provider-section__content">
          <Checkbox
            id="self-hosted-enabled"
            label="Enable Self-Hosted API"
            checked={enabled}
            focusId={F.CHECKBOX}
            navigationOverrides={checkboxNav}
            block
            onChange={handleToggle}
          />

          <Input
            id="self-hosted-url"
            label="Server URL"
            placeholder="http://localhost:3000"
            value={form.url}
            focusId={F.URL}
            focusNavigationOverrides={nav(F.CHECKBOX, F.TOKEN)}
            autoComplete="off"
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          />

          <div className="integration-provider-section__token-row">
            <Input
              id="self-hosted-token"
              label="Instance token"
              type="password"
              placeholder="API_TOKEN from .env"
              value={form.token}
              focusId={F.TOKEN}
              focusNavigationOverrides={nav(F.URL, F.DASHBOARD, { right: { type: "item", itemId: F.SAVE } })}
              autoComplete="off"
              onChange={(e) => setForm((p) => ({ ...p, token: e.target.value }))}
            />
            <Button
              type="button"
              variant="secondary"
              loading={isLoading}
              disabled={!form.url || !form.token || isLoading}
              focusId={F.SAVE}
              focusNavigationOverrides={nav(F.CHECKBOX, F.DASHBOARD, { left: { type: "item", itemId: F.TOKEN } })}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="button"
              variant="tertiary"
              focusId={F.DASHBOARD}
              focusNavigationOverrides={nav(F.TOKEN, F.IMPORT)}
              onClick={() => globalThis.window.electron.openSelfHostedDashboard()}
            >
              Open Dashboard
            </Button>

            <Button
              type="button"
              variant="tertiary"
              loading={importing}
              focusId={F.IMPORT}
              focusNavigationOverrides={nav(F.TOKEN, F.CATALOGUE, { left: { type: "item", itemId: F.DASHBOARD } })}
              onClick={handleImport}
            >
              Import from Hydra Cloud
            </Button>
          </div>

          <Checkbox
            id="self-hosted-catalogue"
            label="[Experimental] Use Steam API for game catalogue"
            checked={Boolean(userPreferences?.useSelfHostedCatalogue)}
            focusId={F.CATALOGUE}
            navigationOverrides={nav(F.DASHBOARD, F.REVIEWS)}
            block
            onChange={(v) => pref("useSelfHostedCatalogue", v)}
          />

          <Checkbox
            id="self-hosted-reviews"
            label="Use self-hosted server for reviews"
            checked={Boolean(userPreferences?.useSelfHostedReviews)}
            focusId={F.REVIEWS}
            navigationOverrides={nav(F.CATALOGUE, F.HLTB)}
            block
            onChange={(v) => pref("useSelfHostedReviews", v)}
          />

          <Checkbox
            id="self-hosted-hltb"
            label="Use self-hosted server for HowLongToBeat"
            checked={Boolean(userPreferences?.useSelfHostedHltb)}
            focusId={F.HLTB}
            navigationOverrides={nav(F.REVIEWS, F.PROTONDB)}
            block
            onChange={(v) => pref("useSelfHostedHltb", v)}
          />

          <Checkbox
            id="self-hosted-protondb"
            label="Use self-hosted server for ProtonDB"
            checked={Boolean(userPreferences?.useSelfHostedProtondb)}
            focusId={F.PROTONDB}
            navigationOverrides={nav(F.HLTB, F.SIGN_OUT)}
            block
            onChange={(v) => pref("useSelfHostedProtondb", v)}
          />

          <Checkbox
            id="self-hosted-signout"
            label="Sign out of official account when closing the app"
            checked={Boolean(userPreferences?.signOutOnExit)}
            focusId={F.SIGN_OUT}
            navigationOverrides={nav(F.PROTONDB, F.SELF_SIGN_OUT)}
            block
            onChange={(v) => pref("signOutOnExit", v)}
          />

          <Checkbox
            id="self-hosted-self-signout"
            label="Sign out of self-hosted account when closing the app"
            checked={Boolean(userPreferences?.selfHostedSignOutOnExit)}
            focusId={F.SELF_SIGN_OUT}
            navigationOverrides={nav(F.SIGN_OUT, F.SESSION)}
            block
            onChange={(v) => pref("selfHostedSignOutOnExit", v)}
          />

          <Input
            id="self-hosted-session"
            label="Self-hosted session duration (days, 0 = never expire)"
            type="number"
            value={String(userPreferences?.selfHostedSessionDurationDays ?? 30)}
            focusId={F.SESSION}
            focusNavigationOverrides={lastOptionalNav}
            onChange={(e) =>
              pref("selfHostedSessionDurationDays", Math.max(0, parseInt(e.target.value) || 0))
            }
          />
        </div>
      </VerticalFocusGroup>
    </SettingsSection>
  );
}
