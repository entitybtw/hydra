import { useContext, useEffect, useState } from "react";
import { useAppSelector } from "@renderer/hooks";
import { settingsContext } from "@renderer/context";
import { CheckboxField } from "@renderer/components";

export function SettingsSteamPresence() {
  const { updateUserPreferences } = useContext(settingsContext);
  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  const [enabled, setEnabled] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<
    Array<{ steamUserId: number; steamId64: string; displayName: string }>
  >([]);

  useEffect(() => {
    window.electron
      .getSteamUserAccounts()
      .then(setAccounts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (userPreferences) {
      setEnabled(Boolean(userPreferences.steamPresenceEnabled));
      setSelectedUserId(userPreferences.steamPresenceUserId ?? null);
    }
  }, [userPreferences]);

  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await updateUserPreferences({ steamPresenceEnabled: next });
  };

  const handleAccountChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const id = Number(e.target.value) || null;
    setSelectedUserId(id);
    await updateUserPreferences({ steamPresenceUserId: id });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <CheckboxField
        label="Steam Rich Presence (Experimental)"
        checked={enabled}
        onChange={handleToggle}
      />

      <p style={{ fontSize: "12px", opacity: 0.6, margin: 0 }}>
        Shows your current game to Steam friends when playing via Hydra.
        <br />
        <strong>Warning:</strong> Does not work with VAC-protected games (CS2,
        TF2, Rust, etc.) — presence is automatically skipped for those.
        <br />
        Steam must be running for the status to update.
      </p>

      {enabled && accounts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "13px" }}>Steam account</span>
          <select
            value={selectedUserId ?? ""}
            onChange={handleAccountChange}
            style={{
              background: "var(--input-background)",
              color: "var(--body-text-color)",
              border: "1px solid var(--input-border-color)",
              borderRadius: "4px",
              padding: "6px 8px",
              fontSize: "13px",
            }}
          >
            <option value="">Select account…</option>
            {accounts.map((a) => (
              <option key={a.steamUserId} value={a.steamUserId}>
                {a.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {enabled && accounts.length === 0 && (
        <p style={{ fontSize: "12px", opacity: 0.6, margin: 0 }}>
          No Steam accounts found on this machine.
        </p>
      )}
    </div>
  );
}
