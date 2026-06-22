import * as vscode from "vscode";
import { randomUUID } from "crypto";

import TaskioComment, { TaskioSyncStatus } from "../types/TaskioComment";
import TaskioPriority from "../types/TaskioPriority";


export class CommentStore {
  private comments: Map<string, TaskioComment>;

  constructor() {
    this.comments = new Map<string, TaskioComment>();
  }

  update(comment: TaskioComment): void {
    comment.syncStatus = normalizeSyncStatus(comment.syncStatus);
    comment.localStableId = comment.localStableId || comment.id || randomUUID();
    this.comments.set(comment.id, comment);
  }

  setMany(newComments: TaskioComment[]): void {
    for (const newC of newComments) {
      this.comments.set(newC.id, normalizeStoredComment(newC));
    }
  }

  clear(): void {
    this.comments.clear();
  }


  remove(id: string): void {
    this.comments.delete(id);
  }

  removeByUri(uri: vscode.Uri): void {
    for (const [id, comment] of this.comments) {
      if (comment.uri.fsPath === uri.fsPath) {
        this.comments.delete(id);
      }
    }
  }

  replaceByUri(uri: vscode.Uri, newComments: TaskioComment[]) {
    const oldComments = this.getByUri(uri);
    const remainingOldComments = [...oldComments];

    this.comments = new Map(
      Array.from(this.comments.entries()).filter(
        ([_, c]) => c.uri.toString() !== uri.toString()
      )
    );

    for (const newC of newComments) {
      const existingIndex = findBestExistingMatchIndex(remainingOldComments, newC);
      const existing = existingIndex >= 0 ? remainingOldComments.splice(existingIndex, 1)[0] : undefined;
      const merged = mergeCommentState(existing, newC);
      this.comments.set(merged.id, merged);
    }
  }


  getAll(): TaskioComment[] {
    return Array.from(this.comments.values());
  }

  getByUri(uri: vscode.Uri): TaskioComment[] {
    return Array.from(this.comments.values()).filter(comment => comment.uri.fsPath === uri.fsPath);
  }

  setPriority(id: string, priority: TaskioPriority): void {
    const comment = this.comments.get(id)

    if (!comment) return;

    comment.priority = priority
    this.comments.set(id, comment);
  }

  getPriority(id: string): string {
    const comment = this.comments.get(id)?.priority ?? 'default';

    return comment
  }

  refresh() {
    this.comments = new Map<string, TaskioComment>(this.comments);
  }

  private upsertComment(newC: TaskioComment): void {
    this.comments.set(newC.id, normalizeStoredComment(newC));
  }
}

function normalizeSyncStatus(status: unknown): TaskioSyncStatus {
  switch (status) {
    case "synced":
    case "modified":
    case "syncing":
    case "error":
    case "never_synced":
      return status;
    case "local":
    default:
      return "never_synced";
  }
}

function normalizeText(text: string | undefined): string {
  return (text ?? "").replace(/\r\n/g, "\n").trimEnd();
}

function findBestExistingMatch(existingComments: TaskioComment[], next: TaskioComment): TaskioComment | undefined {
  const index = findBestExistingMatchIndex(existingComments, next);
  return index >= 0 ? existingComments[index] : undefined;
}

function findBestExistingMatchIndex(existingComments: TaskioComment[], next: TaskioComment): number {
  let best: TaskioComment | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestIndex = -1;

  for (let i = 0; i < existingComments.length; i++) {
    const old = existingComments[i];
    if (old.uri.fsPath !== next.uri.fsPath) continue;

    let score = 0;

    if (old.keyword === next.keyword) score += 25;
    if (normalizeText(old.text) === normalizeText(next.text)) score += 60;
    if (normalizeText(old.displayText) === normalizeText(next.displayText)) score += 12;
    if (old.priority === next.priority) score += 6;
    score += Math.max(0, 40 - Math.abs(old.line - next.line) * 8);

    if (old.trelloCardId) score += 4;

    if (score > bestScore) {
      bestScore = score;
      best = old;
      bestIndex = i;
    }
  }

  return bestScore >= 30 ? bestIndex : -1;
}

function mergeCommentState(existing: TaskioComment | undefined, incoming: TaskioComment): TaskioComment {
  const baseStableId = incoming.localStableId || incoming.id || randomUUID();

  if (!existing) {
    return {
      ...incoming,
      localStableId: baseStableId,
      syncStatus: normalizeSyncStatus(incoming.syncStatus),
    };
  }

  const incomingText = normalizeText(incoming.displayText ?? incoming.text);
  const persistedLastSyncedText = existing.lastSyncedText ?? existing.displayText ?? existing.text;
  const lastSyncedText = normalizeText(persistedLastSyncedText);
  const hasRemoteLink = Boolean(existing.trelloCardId);

  let syncStatus = normalizeSyncStatus(existing.syncStatus);

  if (syncStatus === "syncing" || syncStatus === "error") {
    // Preserve transient or error states until an explicit reconcile succeeds.
  } else if (hasRemoteLink) {
    syncStatus = incomingText !== lastSyncedText ? "modified" : "synced";
  } else {
    syncStatus = "never_synced";
  }

  return {
    ...incoming,
    id: existing.id ?? incoming.id,
    localStableId: existing.localStableId || baseStableId,
    priority: incoming.priority,
    trelloCardId: existing.trelloCardId,
    lastSyncedText: hasRemoteLink ? persistedLastSyncedText : existing.lastSyncedText,
    lastSyncedMetadataHash: existing.lastSyncedMetadataHash,
    lastError: existing.lastError,
    syncStatus,
  };
}

function normalizeStoredComment(comment: TaskioComment): TaskioComment {
  return {
    ...comment,
    syncStatus: normalizeSyncStatus(comment.syncStatus),
    localStableId: comment.localStableId || comment.id || randomUUID(),
  };
}
