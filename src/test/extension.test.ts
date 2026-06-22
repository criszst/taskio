import assert from "node:assert/strict";
import test from "node:test";
import { Uri } from "vscode";

import { CommentStore } from "../store/CommentStore";
import TaskioComment from "../types/TaskioComment";
import { reconcileTrelloTasks } from "../integrations/trello/services/TimerToSync";
import { TaskioDependencies } from "../types/TaskioDependencies";
import { TrelloService } from "../integrations/trello/services/TrelloService";
import TreeMode from "../treeView/TreeMode";

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

test("reconcile reuses an existing Trello card found by LocalId when trelloCardId is missing", async () => {
  const store = new CommentStore();
  const uri = Uri.file("D:/Programacao/Projetos/Taskio/taskio/example.ts");
  const comment: TaskioComment = {
    id: `${uri.toString()}:4:0`,
    localStableId: "stable-comment-id",
    uri,
    line: 4,
    character: 0,
    keyword: "TODO",
    text: "TODO: Replace weak hashing algorithm fixed",
    displayText: "TODO: Replace weak hashing algorithm fixed",
    priority: "default",
    lastSyncedText: "TODO: Replace weak hashing algorithm",
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
    getListCards: async () => ([{
      id: "card-123",
      name: "TODO: Replace weak hashing algorithm",
      desc: [
        "[Taskio]",
        "LocalId: stable-comment-id",
        `File: ${uri.fsPath.replace(/\\/g, "/")}`,
        "Line: 4",
        "Keyword: TODO",
        "Title: TODO: Replace weak hashing algorithm",
        "CardId: card-123",
        "[/Taskio]",
      ].join("\n"),
    }]),
    getCard: async () => ({ id: "card-123", name: "TODO: Replace weak hashing algorithm", desc: "" }),
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
  assert.strictEqual(createCalls, 0);
  assert.strictEqual(updateCalls.length, 1);
  assert.strictEqual(updateCalls[0].cardId, "card-123");

  const [updated] = store.getByUri(uri);
  assert.ok(updated);
  assert.strictEqual(updated.trelloCardId, "card-123");
});

test("replaceByUri keeps all nearby TODOs when a new one is inserted", () => {
  const store = new CommentStore();
  const uri = Uri.file("D:/Programacao/Projetos/Taskio/taskio/example.ts");

  store.setMany([
    {
      id: `${uri.toString()}:1:0`,
      localStableId: "stable-1",
      uri,
      line: 1,
      character: 0,
      keyword: "FIXME",
      text: "FIXME: just example",
      displayText: "FIXME: just example",
      priority: "default",
      trelloCardId: "card-fixme",
      lastSyncedText: "FIXME: just example",
      syncStatus: "synced",
    },
    {
      id: `${uri.toString()}:2:0`,
      localStableId: "stable-2",
      uri,
      line: 2,
      character: 0,
      keyword: "TODO",
      text: "TODO: example",
      displayText: "TODO: example",
      priority: "default",
      trelloCardId: "card-todo-1",
      lastSyncedText: "TODO: example",
      syncStatus: "synced",
    },
    {
      id: `${uri.toString()}:3:0`,
      localStableId: "stable-3",
      uri,
      line: 3,
      character: 0,
      keyword: "TODO",
      text: "TODO: todo example",
      displayText: "TODO: todo example",
      priority: "default",
      trelloCardId: "card-todo-2",
      lastSyncedText: "TODO: todo example",
      syncStatus: "synced",
    },
  ]);

  store.replaceByUri(uri, [
    {
      id: `${uri.toString()}:1:0`,
      localStableId: "new-1",
      uri,
      line: 1,
      character: 0,
      keyword: "FIXME",
      text: "FIXME: just example",
      displayText: "FIXME: just example",
      priority: "default",
      syncStatus: "never_synced",
    },
    {
      id: `${uri.toString()}:2:0`,
      localStableId: "new-2",
      uri,
      line: 2,
      character: 0,
      keyword: "TODO",
      text: "TODO: new inserted example",
      displayText: "TODO: new inserted example",
      priority: "default",
      syncStatus: "never_synced",
    },
    {
      id: `${uri.toString()}:3:0`,
      localStableId: "new-3",
      uri,
      line: 3,
      character: 0,
      keyword: "TODO",
      text: "TODO: example",
      displayText: "TODO: example",
      priority: "default",
      syncStatus: "never_synced",
    },
    {
      id: `${uri.toString()}:4:0`,
      localStableId: "new-4",
      uri,
      line: 4,
      character: 0,
      keyword: "TODO",
      text: "TODO: todo example",
      displayText: "TODO: todo example",
      priority: "default",
      syncStatus: "never_synced",
    },
  ]);

  const comments = store.getByUri(uri);
  assert.strictEqual(comments.length, 4);
  assert.ok(comments.some(c => c.text === "FIXME: just example"));
  assert.ok(comments.some(c => c.text === "TODO: new inserted example"));
  assert.ok(comments.some(c => c.text === "TODO: example"));
  assert.ok(comments.some(c => c.text === "TODO: todo example"));
  assert.strictEqual(comments.find(c => c.text === "TODO: example")?.trelloCardId, "card-todo-1");
  assert.strictEqual(comments.find(c => c.text === "TODO: todo example")?.trelloCardId, "card-todo-2");
});

test("changing priority on one TODO does not leak to the TODO above", () => {
  const store = new CommentStore();
  const uri = Uri.file("D:/Programacao/Projetos/Taskio/taskio/example.ts");

  store.setMany([
    {
      id: `${uri.toString()}:1:0`,
      localStableId: "stable-1",
      uri,
      line: 1,
      character: 0,
      keyword: "TODO",
      text: "TODO: example aaa",
      displayText: "TODO: example aaa",
      priority: "default",
      syncStatus: "never_synced",
    },
    {
      id: `${uri.toString()}:2:0`,
      localStableId: "stable-2",
      uri,
      line: 2,
      character: 0,
      keyword: "TODO",
      text: "TODO!: Other example",
      displayText: "TODO!: Other example",
      priority: "high",
      syncStatus: "never_synced",
    },
  ]);

  store.replaceByUri(uri, [
    {
      id: `${uri.toString()}:1:0`,
      localStableId: "new-1",
      uri,
      line: 1,
      character: 0,
      keyword: "TODO",
      text: "TODO: example aaa",
      displayText: "TODO: example aaa",
      priority: "default",
      syncStatus: "never_synced",
    },
    {
      id: `${uri.toString()}:2:0`,
      localStableId: "new-2",
      uri,
      line: 2,
      character: 0,
      keyword: "TODO",
      text: "TODO: Other example",
      displayText: "TODO: Other example",
      priority: "default",
      syncStatus: "never_synced",
    },
  ]);

  const comments = store.getByUri(uri);
  assert.strictEqual(comments.find(c => c.text === "TODO: example aaa")?.priority, "default");
  assert.strictEqual(comments.find(c => c.text === "TODO: Other example")?.priority, "default");
});

test("identical TODOs keep separate state entries", () => {
  const store = new CommentStore();
  const uri = Uri.file("D:/Programacao/Projetos/Taskio/taskio/example.ts");

  store.setMany([
    {
      id: `${uri.toString()}:1:0`,
      localStableId: "stable-1",
      uri,
      line: 1,
      character: 0,
      keyword: "TODO",
      text: "TODO: example",
      displayText: "TODO: example",
      priority: "default",
      trelloCardId: "card-1",
      syncStatus: "synced",
    },
    {
      id: `${uri.toString()}:2:0`,
      localStableId: "stable-2",
      uri,
      line: 2,
      character: 0,
      keyword: "TODO",
      text: "TODO: example",
      displayText: "TODO: example",
      priority: "default",
      trelloCardId: "card-2",
      syncStatus: "synced",
    },
  ]);

  const comments = store.getByUri(uri);
  assert.strictEqual(comments.length, 2);
  assert.strictEqual(comments[0].trelloCardId, "card-1");
  assert.strictEqual(comments[1].trelloCardId, "card-2");
});

test("list mode keeps high priority tasks before lower priorities", () => {
  const store = new CommentStore();
  const uri = Uri.file("D:/Programacao/Projetos/Taskio/taskio/example.ts");

  store.setMany([
    {
      id: `${uri.toString()}:1:0`,
      localStableId: "stable-1",
      uri,
      line: 1,
      character: 0,
      keyword: "TODO",
      text: "TODO: default task",
      displayText: "TODO: default task",
      priority: "default",
      syncStatus: "never_synced",
    },
    {
      id: `${uri.toString()}:2:0`,
      localStableId: "stable-2",
      uri,
      line: 2,
      character: 0,
      keyword: "TODO",
      text: "TODO: high task",
      displayText: "TODO: high task",
      priority: "high",
      syncStatus: "never_synced",
    },
    {
      id: `${uri.toString()}:3:0`,
      localStableId: "stable-3",
      uri,
      line: 3,
      character: 0,
      keyword: "TODO",
      text: "TODO: medium task",
      displayText: "TODO: medium task",
      priority: "medium",
      syncStatus: "never_synced",
    },
    {
      id: `${uri.toString()}:4:0`,
      localStableId: "stable-4",
      uri,
      line: 4,
      character: 0,
      keyword: "TODO",
      text: "TODO: low task",
      displayText: "TODO: low task",
      priority: "low",
      syncStatus: "never_synced",
    },
  ]);

  const treeMode = new TreeMode(store);
  const nodes = treeMode.getListMode();

  assert.deepStrictEqual(
    nodes.map(node => node.comment.displayText),
    [
      "TODO: high task",
      "TODO: medium task",
      "TODO: low task",
      "TODO: default task",
    ],
  );
});
