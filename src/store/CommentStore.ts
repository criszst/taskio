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
    const signatureBuckets = new Map<string, number[]>();
    const usedOldIndexes = new Set<number>();

    this.comments = new Map(
      Array.from(this.comments.entries()).filter(
        ([_, c]) => c.uri.toString() !== uri.toString()
      )
    );

    for (let i = 0; i < remainingOldComments.length; i++) {
      const old = remainingOldComments[i];
      const key = getSignatureKey(old);
      const bucket = signatureBuckets.get(key) ?? [];
      bucket.push(i);
      signatureBuckets.set(key, bucket);
    }

    for (const newC of newComments) {
      const existingIndex = takeExactSignatureMatch(signatureBuckets, remainingOldComments, usedOldIndexes, newC)
        ?? takeRelaxedSignatureMatch(remainingOldComments, usedOldIndexes, newC);
      const existing = existingIndex >= 0 ? remainingOldComments[existingIndex] : undefined;
      if (existingIndex >= 0) usedOldIndexes.add(existingIndex);
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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeKeyword(keyword: string): string {
  return keyword.toUpperCase().replace(/[!?.:;,\s]+$/g, "");
}

function normalizeTaskText(comment: TaskioComment): string {
  const baseKeyword = normalizeKeyword(comment.keyword);
  const text = normalizeText(comment.displayText ?? comment.text);
  const withoutMarker = text.replace(
    new RegExp(`^${escapeRegExp(baseKeyword)}[!\\s]*:?\\s*`, "i"),
    ""
  );

  return withoutMarker.replace(/\s+/g, " ").trim().toLowerCase();
}

function getSignatureKey(comment: TaskioComment): string {
  return `${normalizeKeyword(comment.keyword)}|${normalizeTaskText(comment)}`;
}

function tokenizeTaskText(comment: TaskioComment): string[] {
  const tokens = normalizeTaskText(comment).match(/[a-z0-9]+/g) ?? [];
  return tokens.filter(token => token.length > 1);
}

function tokenSimilarity(a: TaskioComment, b: TaskioComment): number {
  const tokensA = new Set(tokenizeTaskText(a));
  const tokensB = new Set(tokenizeTaskText(b));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }

  return overlap / Math.max(tokensA.size, tokensB.size);
}

function takeExactSignatureMatch(
  signatureBuckets: Map<string, number[]>,
  existingComments: TaskioComment[],
  usedOldIndexes: Set<number>,
  next: TaskioComment,
): number | undefined {
  const key = getSignatureKey(next);
  const bucket = signatureBuckets.get(key);

  if (!bucket || bucket.length === 0) {
    return undefined;
  }

  while (bucket.length > 0) {
    const index = bucket.shift()!;
    if (existingComments[index] && !usedOldIndexes.has(index)) {
      return index;
    }
  }

  return undefined;
}

function takeRelaxedSignatureMatch(existingComments: TaskioComment[], usedOldIndexes: Set<number>, next: TaskioComment): number {
  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < existingComments.length; i++) {
    const old = existingComments[i];
    if (usedOldIndexes.has(i)) continue;
    if (old.uri.fsPath !== next.uri.fsPath) continue;
    if (normalizeKeyword(old.keyword) !== normalizeKeyword(next.keyword)) continue;

    const similarity = tokenSimilarity(old, next);
    const lineDistance = Math.abs(old.line - next.line);
    const score = similarity - Math.min(lineDistance, 10) * 0.03;

    if (similarity >= 0.8 && score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function findBestExistingMatch(existingComments: TaskioComment[], next: TaskioComment): TaskioComment | undefined {
  const key = getSignatureKey(next);
  const exact = existingComments.find(comment => getSignatureKey(comment) === key);
  if (exact) return exact;

  const index = takeRelaxedSignatureMatch(existingComments, new Set<number>(), next);
  return index >= 0 ? existingComments[index] : undefined;
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
