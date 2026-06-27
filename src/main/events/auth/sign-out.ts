import { registerEvent } from "../register-event";
import {
  DownloadManager,
  HydraApi,
  WSClient,
  WindowManager,
  emulators,
  gamesPlaytime,
} from "@main/services";
import {
  db,
  downloadLayoutStateSublevel,
  downloadsSublevel,
  gamesSublevel,
  levelKeys,
} from "@main/level";

const signOut = async (_event: Electron.IpcMainInvokeEvent) => {
  const isSelfHostedActive = HydraApi.isSelfHostedAuthenticated();

  const databaseOperations = db
    .batch([
      {
        type: "del",
        key: levelKeys.auth,
      },
      {
        type: "del",
        key: levelKeys.user,
      },
    ])
    .then(() => {
      gamesPlaytime.clear();

      if (isSelfHostedActive) return Promise.resolve();

      return Promise.all([
        gamesSublevel.clear(),
        downloadsSublevel.clear(),
        downloadLayoutStateSublevel.clear(),
        emulators.resetEmulatorScanData(),
      ]);
    });

  DownloadManager.cancelDownload();

  HydraApi.handleSignOut();

  WindowManager.closeFriendsWindow();

  await Promise.all([
    databaseOperations,
    HydraApi.post("/auth/logout").catch(() => {}),
  ]);

  WSClient.close();
};

registerEvent("signOut", signOut);

