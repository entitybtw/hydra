import { registerEvent } from "../register-event";
import { getSteamUserAccounts } from "@main/services/steam-presence";

registerEvent("getSteamUserAccounts", async () => {
  return getSteamUserAccounts();
});
