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
    const oldComments = this.getByUri(uri).sort(compareComments);
    const orderedNewComments = [...newComments].sort(compareComments);
    const signatureBuckets = new Map<string, number[]>();
    const usedOldIndexes = new Set<number>();
    const reconciledComments = new Array<TaskioComment>(orderedNewComments.length);

    for (let i = 0; i < oldComments.length; i++) {
      const old = oldComments[i];
      const key = getSignatureKey(old);
      const bucket = signatureBuckets.get(key) ?? [];
      bucket.push(i);
      signatureBuckets.set(key, bucket);
    }

    for (let newIndex = 0; newIndex < orderedNewComments.length; newIndex++) {
      const newC = orderedNewComments[newIndex];
      const existingIndex = takeExactSignatureMatch(signatureBuckets, oldComments, usedOldIndexes, newC);

      if (existingIndex === undefined) {
        continue;
      }

      usedOldIndexes.add(existingIndex);
      reconciledComments[newIndex] = mergeCommentState(oldComments[existingIndex], newC);
    }

    const unmatchedOldByKeyword = new Map<string, TaskioComment[]>();

    for (let i = 0; i < oldComments.length; i++) {
      if (usedOldIndexes.has(i)) continue;

      const old = oldComments[i];
      const keyword = normalizeKeyword(old.keyword);
      const bucket = unmatchedOldByKeyword.get(keyword) ?? [];
      bucket.push(old);
      unmatchedOldByKeyword.set(keyword, bucket);
    }

    for (let newIndex = 0; newIndex < orderedNewComments.length; newIndex++) {
      if (reconciledComments[newIndex]) continue;

      const newC = orderedNewComments[newIndex];
      const keyword = normalizeKeyword(newC.keyword);
      const bucket = unmatchedOldByKeyword.get(keyword);
      const existing = bucket?.shift();

      reconciledComments[newIndex] = mergeCommentState(existing, newC);
    }

    const nextComments = new Map<string, TaskioComment>(
      Array.from(this.comments.entries()).filter(([_, c]) => c.uri.toString() !== uri.toString())
    );

    for (const comment of reconciledComments) {
      nextComments.set(comment.id, normalizeStoredComment(comment));
    }

    this.comments = nextComments;
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

function compareComments(a: TaskioComment, b: TaskioComment): number {
  if (a.line !== b.line) return a.line - b.line;
  if (a.character !== b.character) return a.character - b.character;
  return a.id.localeCompare(b.id);
}
