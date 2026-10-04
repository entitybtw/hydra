import { HydraApi } from "../hydra-api";
import type { GameShop, SteamAchievement } from "@types";
import { UserNotLoggedInError } from "@shared";
import { logger } from "../logger";
import { db, gameAchievementsSublevel, levelKeys } from "@main/level";
import { AchievementMemoryStore } from "./achievement-memory-store";

export const getGameAchievementData = async (
  objectId: string,
  shop: GameShop,
  useCachedData: boolean
) => {
  if (shop === "custom") {
    return [];
  }

  const gameKey = levelKeys.game(shop, objectId);

  const cachedAchievements = await gameAchievementsSublevel.get(gameKey);

  const language = await db
    .get<string, string>(levelKeys.language, {
      valueEncoding: "utf8",
    })
    .then((language) => language || "en");

  if (
    useCachedData &&
    cachedAchievements?.achievements &&
    cachedAchievements.language === language
  ) {
    return cachedAchievements.achievements;
  }

  return HydraApi.getResponse<SteamAchievement[]>(
    `/games/${shop}/${objectId}/achievements`,
    { language },
    {
      ifNoneMatch:
        cachedAchievements?.language === language
          ? cachedAchievements.catalogueValidator
          : undefined,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 304,
    }
  )
    .then(async (response) => {
      if (response.status === 304) {
        return cachedAchievements?.achievements ?? [];
      }

      const achievements =
        response.data.length > 0
          ? response.data
          : (cachedAchievements?.achievements ?? []);

      const unlockedAchievements =
        cachedAchievements?.unlockedAchievements ?? [];
      const catalogueValidator =
        typeof response.headers.etag === "string"
          ? response.headers.etag
          : undefined;

      await gameAchievementsSublevel.put(gameKey, {
        unlockedAchievements,
        achievements,
        updatedAt: Date.now(),
        language,
        catalogueValidator,
      });

      const memoryEntry = AchievementMemoryStore.get(shop, objectId);
      AchievementMemoryStore.set(shop, objectId, {
        achievements,
        unlockedAchievements:
          memoryEntry?.unlockedAchievements ?? unlockedAchievements,
        language,
        catalogueValidator:
          memoryEntry?.catalogueValidator ?? catalogueValidator,
      });

      return achievements;
    })
    .catch((err) => {
      if (err instanceof UserNotLoggedInError) {
        throw err;
      }

      logger.error("Failed to get game achievements for", objectId, err);

      return cachedAchievements?.achievements ?? [];
    });
};
