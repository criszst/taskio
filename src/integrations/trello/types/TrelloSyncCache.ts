export type TrelloSyncCacheEntry = {
  nameHash?: string;
  taskioBlockHash?: string;
  lastSyncedAt?: number;
};

export type TrelloSyncCache = Record<string, TrelloSyncCacheEntry>;
