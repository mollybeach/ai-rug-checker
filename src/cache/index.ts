import { CacheManager, type Character, DbCacheAdapter } from "@elizaos/core";

export function initializeDbCache(
  character: Character,
  db: any
): CacheManager {
  if (!character.id) {
    throw new Error("Character ID is required for cache initialization");
  }
  const cache = new CacheManager(new DbCacheAdapter(db, character.id));
  return cache;
}