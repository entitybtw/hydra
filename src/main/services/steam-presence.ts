import fs from "node:fs";
import path from "node:path";
import { getSteamLocation } from "./steam";
import { logger } from "./logger";

/*
 * EXPERIMENTAL: Steam Rich Presence emulation via localconfig.vdf.
 * This writes the "InGameID" field so Steam shows the user as playing
 * a game to friends. Use only with non-VAC games — see VAC_PROTECTED_APPS.
 *
 * WARNING: Do NOT use this with VAC-protected games. Modifying localconfig.vdf
 * while a VAC game is running may trigger a VAC ban.
 */

// Known VAC-protected games — presence is silently skipped for these.
// AppIDs from: https://store.steampowered.com/search/?category2=8
const VAC_PROTECTED_APPS = new Set([
  // CS2 / CS:GO
  "730",
  "10",
  // TF2
  "440",
  // Dota 2
  "570",
  // PUBG
  "578080",
  // Rust
  "252490",
  // Apex Legends
  "1172470",
  // Rainbow Six Siege
  "359550",
  // Destiny 2
  "1085660",
  // Left 4 Dead 2
  "550",
  // Garry's Mod
  "4000",
  // ARK
  "346110",
  // DayZ
  "221100",
  // Squad
  "393380",
  // Insurgency: Sandstorm
  "581320",
  // EFT (not on Steam but just in case)
  "1407200",
]);

export const isVacProtected = (steamAppId: string) =>
  VAC_PROTECTED_APPS.has(steamAppId);

// SteamID3 → SteamID64 conversion
const steamId3ToId64 = (steamId3: number) =>
  BigInt(steamId3) + 76561197960265728n;

const getLocalConfigPath = async (steamUserId: number) => {
  const steamLocation = await getSteamLocation().catch(() => null);
  if (!steamLocation) return null;
  return path.join(
    steamLocation,
    "userdata",
    steamUserId.toString(),
    "config",
    "localconfig.vdf"
  );
};

const readVdf = (filePath: string): string => {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
};

const setInGameId = (vdf: string, appId: string | null): string => {
  if (appId === null) {
    return vdf.replace(/\t*"InGameID"\t+"[^"]*"\n?/g, "");
  }

  const replacement = `\t\t"InGameID"\t\t"${appId}"`;

  if (/"InGameID"\s+"[^"]*"/.test(vdf)) {
    return vdf.replace(/"InGameID"\s+"[^"]*"/, `"InGameID"\t\t"${appId}"`);
  }

  return vdf.replace(/("friends"\s*\{)/, `$1\n${replacement}`);
};

export const setSteamGamePresence = async (
  steamUserId: number,
  steamAppId: string
) => {
  if (isVacProtected(steamAppId)) {
    logger.info(
      `Steam presence skipped — VAC-protected game: appId=${steamAppId}`
    );
    return;
  }

  try {
    const configPath = await getLocalConfigPath(steamUserId);
    if (!configPath) return;

    const vdf = readVdf(configPath);
    const updated = setInGameId(vdf, steamAppId);
    fs.writeFileSync(configPath, updated, "utf8");
    logger.info(`Steam presence set: appId=${steamAppId} user=${steamUserId}`);
  } catch (err) {
    logger.error("Failed to set Steam presence", err);
  }
};

export const clearSteamGamePresence = async (steamUserId: number) => {
  try {
    const configPath = await getLocalConfigPath(steamUserId);
    if (!configPath) return;

    const vdf = readVdf(configPath);
    const updated = setInGameId(vdf, null);
    fs.writeFileSync(configPath, updated, "utf8");
    logger.info(`Steam presence cleared for user=${steamUserId}`);
  } catch (err) {
    logger.error("Failed to clear Steam presence", err);
  }
};

export const getSteamUserAccounts = async () => {
  const steamLocation = await getSteamLocation().catch(() => null);
  if (!steamLocation) return [];

  const userDataPath = path.join(steamLocation, "userdata");
  if (!fs.existsSync(userDataPath)) return [];

  const dirs = fs
    .readdirSync(userDataPath, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+$/.test(d.name));

  return dirs.map((d) => {
    const id3 = Number(d.name);
    const id64 = steamId3ToId64(id3).toString();
    const configPath = path.join(
      userDataPath,
      d.name,
      "config",
      "localconfig.vdf"
    );
    let displayName = id64;
    if (fs.existsSync(configPath)) {
      const match = fs
        .readFileSync(configPath, "utf8")
        .match(/"PersonaName"\s+"([^"]+)"/);
      if (match) displayName = match[1];
    }
    return { steamUserId: id3, steamId64: id64, displayName };
  });
};
