import crypto from 'crypto';

import { Uri, workspace } from "vscode";

import TaskioComment from "../../../types/TaskioComment";
import { TaskioDependencies } from "../../../types/TaskioDependencies";
import { TrelloSyncCache } from "../types/TrelloSyncCache";
import { TrelloService } from "./TrelloService";

export type TrelloAutoSyncSetting = number | false;

const START = "[Taskio]";
const END = "[/Taskio]";
const CACHE_KEY = "taskio.trello.syncCache.v1";
const TIMER_KEY = "timerToSync";
const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function renderTaskioBlock(comment: TaskioComment, docUri: Uri): string {
  const filePath = docUri.fsPath.replace(/\\/g, "/");
  const line = comment.line + 1;

  return [
    "[Taskio]",
    `File: ${filePath}`,
    `Line: ${line}`,
    comment.priority ? `Priority: ${comment.priority}` : undefined,
    comment.displayText ? `Title: ${comment.displayText}` : undefined,
    `Key: ${comment.trelloCardId ?? ""}`, // it just needs to be present for the hash, the actual value doesn't matter since we won't update the card if the name hasn't changed
    "[/Taskio]",
  ].filter(Boolean).join("\n");
}

export function upsertTaskioBlock(existingDesc: string, newBlock: string): string {
  const desc = existingDesc ?? "";
  const pattern = new RegExp(
    `${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`,
    "m"
  );

  if (pattern.test(desc)) {
    return desc.replace(pattern, newBlock);
  }

  // if no existing block, append the new block to the end of the description with a separator
  const prefix = desc.trimEnd().length ? `${desc.trimEnd()}\n\n---\n` : "";
  return `${prefix}${newBlock}\n---\n`;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}



export function normalizeForHash(input: string): string {
  return input.replace(/\r\n/g, "\n").trimEnd();
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function loadTrelloSyncCache(deps: TaskioDependencies): TrelloSyncCache {
  return deps.context.workspaceState.get<TrelloSyncCache>(CACHE_KEY) ?? {};
}

export async function saveTrelloSyncCache(deps: TaskioDependencies, cache: TrelloSyncCache): Promise<void> {
  await deps.context.workspaceState.update(CACHE_KEY, cache);
}

export async function clearTrelloSyncCache(deps: TaskioDependencies): Promise<void> {
  await deps.context.workspaceState.update(CACHE_KEY, undefined);
}

function normalizeAutoSyncSetting(value: unknown): TrelloAutoSyncSetting | undefined {
  if (value === false) return false;

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  return undefined;
}

export function getTrelloAutoSyncSetting(): TrelloAutoSyncSetting {
  return loadTrelloAutoSyncSetting() ?? false;
}

function loadTrelloAutoSyncSetting(): TrelloAutoSyncSetting | undefined {
  return normalizeAutoSyncSetting(workspace.getConfiguration("taskio.trello").get<unknown>(TIMER_KEY));
}

export function describeTrelloAutoSyncSetting(setting: TrelloAutoSyncSetting): string {
  if (!setting) return "Disabled";

  return `Every ${setting} minute${setting === 1 ? "" : "s"} after save`;
}

export function clearTrelloAutoSyncTimer(docUri: Uri): void {
  const key = docUri.toString();
  const timer = scheduledTimers.get(key);

  if (timer) {
    clearTimeout(timer);
  }

  scheduledTimers.delete(key);
}

export function clearAllTrelloAutoSyncTimers(): void {
  for (const timer of scheduledTimers.values()) {
    clearTimeout(timer);
  }

  scheduledTimers.clear();
}

export function scheduleTrelloAutoSync(
  docUri: Uri,
  tasks: TaskioComment[],
  deps: TaskioDependencies,
  trello: TrelloService,
  minutes: TrelloAutoSyncSetting,
): void {
  clearTrelloAutoSyncTimer(docUri);

  if (!minutes) return;

  const syncedTasks = tasks
    .filter(task => task.syncStatus === "synced" && task.trelloCardId)
    .map(task => ({ ...task }));

  if (syncedTasks.length === 0) return;

  const key = docUri.toString();
  const timer = setTimeout(() => {
    scheduledTimers.delete(key);

    void syncCardsPatchOnlyOnSave(syncedTasks, deps, trello).catch((error) => {
      console.error(`[Taskio] Failed to auto-sync Trello tasks for ${key}:`, error);
    });
  }, minutes * 60 * 1000);

  scheduledTimers.set(key, timer);
}

export async function syncCardsPatchOnlyOnSave(
  tasks: TaskioComment[],
  deps: TaskioDependencies,
  trello: TrelloService,
): Promise<void> {
  if (tasks.length === 0) return;

  const cache = loadTrelloSyncCache(deps);
  let cacheUpdated = false;

  for (const task of tasks) {
    const cardId = task.trelloCardId;
    if (!cardId) continue;

    const desiredName = task.displayText ?? task.text;
    const desiredBlock = renderTaskioBlock(task, task.uri);

    const desiredNameHash = sha256Hex(normalizeForHash(desiredName));
    const desiredBlockHash = sha256Hex(normalizeForHash(desiredBlock));

    const previous = cache[cardId] ?? {};
    const nameChanged = previous.nameHash !== desiredNameHash;
    const blockChanged = previous.taskioBlockHash !== desiredBlockHash;

    if (!nameChanged && !blockChanged) continue;

    const patch: { name?: string; description?: string } = {};

    if (nameChanged) patch.name = desiredName;

    if (blockChanged) {
      const card = await trello.getCard(cardId, ["desc"]);
      const currentDesc = card.desc ?? "";
      const merged = upsertTaskioBlock(currentDesc, desiredBlock);

      if (normalizeForHash(merged) !== normalizeForHash(currentDesc)) {
        patch.description = merged;
      }
    }

    if (patch.name || patch.description) {
      await trello.updateCard(cardId, patch);
    }

    cache[cardId] = {
      nameHash: desiredNameHash,
      taskioBlockHash: desiredBlockHash,
      lastSyncedAt: Date.now(),
    };
    cacheUpdated = true;
  }

  if (cacheUpdated) {
    await saveTrelloSyncCache(deps, cache);
    await deps.context.workspaceState.update("taskio.comments", deps.store.getAll());
  }
}
