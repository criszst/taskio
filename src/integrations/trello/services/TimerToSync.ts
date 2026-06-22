import crypto from "crypto";

import { Uri, window, workspace } from "vscode";

import TaskioComment from "../../../types/TaskioComment";
import { TaskioDependencies } from "../../../types/TaskioDependencies";
import { TrelloService } from "./TrelloService";

export type TrelloAutoSyncSetting = number | false;

const START = "[Taskio]";
const END = "[/Taskio]";
const CACHE_KEY = "taskio.trello.syncCache.v1";
const TIMER_KEY = "timerToSync";
const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();
const reconcileLocks = new Map<string, Promise<void>>();

export function renderTaskioBlock(comment: TaskioComment, docUri: Uri): string {
  const filePath = docUri.fsPath.replace(/\\/g, "/");
  const line = comment.line + 1;
  const title = comment.displayText ?? comment.text;

  return [
    START,
    `LocalId: ${comment.localStableId}`,
    `File: ${filePath}`,
    `Line: ${line}`,
    `Keyword: ${comment.keyword}`,
    comment.priority ? `Priority: ${comment.priority}` : undefined,
    title ? `Title: ${title}` : undefined,
    `CardId: ${comment.trelloCardId ?? ""}`,
    END,
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

export function loadTrelloSyncCache(deps: TaskioDependencies) {
  return deps.context.workspaceState.get<Record<string, unknown>>(CACHE_KEY) ?? {};
}

export async function saveTrelloSyncCache(deps: TaskioDependencies, cache: Record<string, unknown>): Promise<void> {
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

export async function refreshAllTrelloAutoSyncTimers(deps: TaskioDependencies): Promise<void> {
  clearAllTrelloAutoSyncTimers();

  const minutes = getTrelloAutoSyncSetting();
  if (!minutes) return;

  const creds = await deps.secretStore.getTrelloCredentials();
  if (!creds) return;

  const listId = deps.context.workspaceState.get<string>("taskio.trello.listId");
  if (!listId) return;

  const trello = new TrelloService(deps.secretStore);
  const byUri = new Map<string, TaskioComment[]>();

  for (const comment of deps.store.getAll()) {
    const key = comment.uri.toString();
    const bucket = byUri.get(key) ?? [];
    bucket.push(comment);
    byUri.set(key, bucket);
  }

  for (const [uriStr] of byUri) {
    scheduleTrelloAutoSync(Uri.parse(uriStr), deps, trello, minutes);
  }
}

export function scheduleTrelloAutoSync(
  docUri: Uri,
  deps: TaskioDependencies,
  trello: TrelloService,
  minutes: TrelloAutoSyncSetting,
): void {
  clearTrelloAutoSyncTimer(docUri);

  if (!minutes) return;

  const key = docUri.toString();
  const timer = setTimeout(() => {
    scheduledTimers.delete(key);

    const comments = deps.store.getByUri(docUri);
    if (comments.length === 0) return;

    void reconcileTrelloTasks(comments, deps, trello, "auto")
      .catch((error) => {
        console.error(`[Taskio] Failed to auto-sync Trello tasks for ${key}:`, error);
      });
  }, minutes * 60 * 1000);

  scheduledTimers.set(key, timer);
  console.info(`[Taskio] Auto-sync scheduled for ${key} in ${minutes} minute(s).`);
}

export type TrelloReconcileMode = "manual" | "startup" | "auto";

export type TrelloReconcileResult = {
  successCount: number;
  failureCount: number;
  skippedCount: number;
};

export async function reconcileTrelloTasks(
  tasks: TaskioComment[],
  deps: TaskioDependencies,
  trello: TrelloService,
  mode: TrelloReconcileMode,
): Promise<TrelloReconcileResult> {
  if (tasks.length === 0) {
    return { successCount: 0, failureCount: 0, skippedCount: 0 };
  }

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  let storeChanged = false;

  for (const task of tasks) {
    try {
      const result = await reconcileSingleTask(task, deps, trello);
      if (result === "skipped") {
        skippedCount += 1;
      } else {
        successCount += 1;
        storeChanged = true;
      }
    } catch (error) {
      failureCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      task.syncStatus = "error";
      task.lastError = message;
      deps.store.update(task);
      storeChanged = true;
      console.error(`[Taskio] Failed to reconcile "${task.displayText ?? task.text}" (${mode}):`, error);
    }
  }

  if (storeChanged) {
    await persistTrelloComments(deps);
    deps.treeProvider.refresh();
    deps.updateTreeTitle(deps.treeView, deps.store);

    for (const editor of window.visibleTextEditors) {
      deps.applyDecorators(editor, deps.store);
    }
  }

  return { successCount, failureCount, skippedCount };
}

async function reconcileSingleTask(
  task: TaskioComment,
  deps: TaskioDependencies,
  trello: TrelloService,
): Promise<"updated" | "created" | "skipped"> {
  const stableId = ensureStableIdentity(task);
  const listId = deps.context.workspaceState.get<string>("taskio.trello.listId");

  if (!listId) {
    throw new Error("No Trello list configured.");
  }

  const desiredName = task.displayText ?? task.text;
  const desiredBlock = renderTaskioBlock(task, task.uri);
  const desiredBlockHash = sha256Hex(normalizeForHash(desiredBlock));
  const currentBlockHash = desiredBlockHash;

  const hasRemoteLink = Boolean(task.trelloCardId);
  const hasLocalChanges =
    task.lastSyncedText !== desiredName ||
    task.lastSyncedMetadataHash !== currentBlockHash;

  if (task.syncStatus === "synced" && hasRemoteLink && !hasLocalChanges) {
    return "skipped";
  }

  const existing = reconcileLocks.get(stableId);
  if (existing) {
    await existing;
    return "skipped";
  }

  const run = (async () => {
    task.syncStatus = "syncing";
    task.lastError = undefined;
    deps.store.update(task);

    if (hasRemoteLink) {
      const currentCard = await trello.getCard(task.trelloCardId!, ["desc"]);
      const currentDesc = currentCard.desc ?? "";
      const mergedDesc = upsertTaskioBlock(currentDesc, desiredBlock);

      if (
        normalizeForHash(mergedDesc) !== normalizeForHash(currentDesc) ||
        currentCard.name !== desiredName
      ) {
        await trello.updateCard(task.trelloCardId!, {
          name: desiredName,
          description: mergedDesc,
        });
      }
    } else {
      const card = await trello.createCard({
        listId,
        name: desiredName,
        description: desiredBlock,
        priority: task.priority,
      });

      task.trelloCardId = card.id;
    }

    task.localStableId = stableId;
    task.lastSyncedText = desiredName;
    task.lastSyncedMetadataHash = currentBlockHash;
    task.syncStatus = "synced";
    task.lastError = undefined;
    deps.store.update(task);
  })();

  reconcileLocks.set(stableId, run);

  try {
    await run;
  } finally {
    reconcileLocks.delete(stableId);
  }

  return hasRemoteLink ? "updated" : "created";
}

function ensureStableIdentity(task: TaskioComment): string {
  if (task.localStableId) return task.localStableId;

  const stableId = task.id || crypto.randomUUID();
  task.localStableId = stableId;
  return stableId;
}

async function persistTrelloComments(deps: TaskioDependencies): Promise<void> {
  await deps.context.workspaceState.update("taskio.comments", deps.store.getAll());
}
