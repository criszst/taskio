import assert from "node:assert/strict";
import test from "node:test";
import { Uri } from "vscode";

import { CommentStore } from "../store/CommentStore";
import TaskioComment from "../types/TaskioComment";
import { reconcileTrelloTasks } from "../integrations/trello/services/TimerToSync";
import { TaskioDependencies } from "../types/TaskioDependencies";
import { TrelloService } from "../integrations/trello/services/TrelloService";

test("preserves Trello linkage when a synced TODO changes text", () => {
  const store = new CommentStore();
  const uri = Uri.file("D:/Programacao/Projetos/Taskio/taskio/example.ts");
  const stableId = "stable-comment-id";

  const syncedComment: TaskioComment = {
    id: `${uri.toString()}:1:0`,
    localStableId: stableId,
    uri,
    line: 1,
    character: 0,
    keyword: "TODO",
    text: "TODO: replace weak hashing algorithm",
    displayText: "TODO: replace weak hashing algorithm",
    priority: "default",
    trelloCardId: "card-123",
    lastSyncedText: "TODO: replace weak hashing algorithm",
    lastSyncedMetadataHash: "hash-1",
    syncStatus: "synced",
  };

  store.setMany([syncedComment]);

  const editedComment: TaskioComment = {
    id: `${uri.toString()}:1:0`,
    localStableId: "new-stable-id",
    uri,
    line: 1,
    character: 0,
    keyword: "TODO",
    text: "TODO: replace weak hashing algorithm fixed",
    displayText: "TODO: replace weak hashing algorithm fixed",
    priority: "default",
    syncStatus: "never_synced",
  };

  store.replaceByUri(uri, [editedComment]);

  const [result] = store.getByUri(uri);
  assert.ok(result);
  assert.strictEqual(result.localStableId, stableId);
  assert.strictEqual(result.trelloCardId, "card-123");
  assert.strictEqual(result.syncStatus, "modified");
});

test("reconcile updates an existing Trello card instead of creating a duplicate", async () => {
  const store = new CommentStore();
  const uri = Uri.file("D:/Programacao/Projetos/Taskio/taskio/example.ts");
  const comment: TaskioComment = {
    id: `${uri.toString()}:4:0`,
    localStableId: "stable-comment-id",
    uri,
    line: 4,
    character: 0,
    keyword: "FIXME",
    text: "FIXME!!!: Replace weak hashing algorithm fixed",
    displayText: "FIXME!!!: Replace weak hashing algorithm fixed",
    priority: "high",
    trelloCardId: "card-123",
    lastSyncedText: "FIXME!!!: Replace weak hashing algorithm",
    lastSyncedMetadataHash: "hash-previous",
    syncStatus: "modified",
  };

  store.setMany([comment]);

  const workspaceState = new Map<string, unknown>([
    ["taskio.trello.listId", "list-1"],
  ]);

  const updateCalls: Array<{ cardId: string; body: { name?: string; description?: string } }> = [];
  let createCalls = 0;

  const trello = {
    getCard: async () => ({
      id: "card-123",
      name: "FIXME!!!: Replace weak hashing algorithm",
      desc: "old description",
    }),
    updateCard: async (cardId: string, body: { name?: string; description?: string }) => {
      updateCalls.push({ cardId, body });
    },
    createCard: async () => {
      createCalls += 1;
      return { id: "card-new" };
    },
  } as unknown as TrelloService;

  const deps = {
    store,
    treeProvider: { refresh: () => undefined },
    treeView: { title: "" },
    applyDecorators: () => undefined,
    updateTreeTitle: (treeView: { title: string }) => {
      treeView.title = `Tree View (${store.getAll().length})`;
    },
    secretStore: {},
    context: {
      workspaceState: {
        get: <T>(key: string, fallback?: T) => (workspaceState.has(key) ? workspaceState.get(key) as T : fallback),
        update: async (key: string, value: unknown) => {
          if (value === undefined) {
            workspaceState.delete(key);
          } else {
            workspaceState.set(key, value);
          }
        },
      },
    },
  } as unknown as TaskioDependencies;

  const result = await reconcileTrelloTasks([comment], deps, trello, "manual");

  assert.strictEqual(result.successCount, 1);
  assert.strictEqual(result.failureCount, 0);
  assert.strictEqual(result.skippedCount, 0);
  assert.strictEqual(createCalls, 0);
  assert.strictEqual(updateCalls.length, 1);
  assert.strictEqual(updateCalls[0].cardId, "card-123");
  assert.strictEqual(updateCalls[0].body.name, "FIXME!!!: Replace weak hashing algorithm fixed");
  assert.ok(updateCalls[0].body.description?.includes("LocalId: stable-comment-id"));
  assert.ok(updateCalls[0].body.description?.includes("CardId: card-123"));

  const [updated] = store.getByUri(uri);
  assert.ok(updated);
  assert.strictEqual(updated.trelloCardId, "card-123");
  assert.strictEqual(updated.syncStatus, "synced");
  assert.strictEqual(updated.lastSyncedText, "FIXME!!!: Replace weak hashing algorithm fixed");
});
