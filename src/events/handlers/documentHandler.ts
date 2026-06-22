import * as vscode from 'vscode';

import { TaskioDependencies } from '../../types/TaskioDependencies';

import ScanDocument from '../../treeView/scanner/DocumentScanner';
import shouldIgnoreDocument from '../../config/IgnoredFiles';

import EventManager from '../EventManager';
import OnUserSaveFile from '../../integrations/trello/events/OnUserSaveFile';

const DOCUMENT_SYNC_DEBOUNCE_MS = 180;
const pendingDocumentSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();


export function registerDocumentHandler(manager: EventManager, deps: TaskioDependencies): void {
  const { store, applyDecorators } = deps;

  manager.register({ dispose: clearAllQueuedDocumentSyncs });
  manager.register(vscode.workspace.onDidChangeTextDocument(e => queueSyncDocument(e.document, deps)));

  manager.register(vscode.window.onDidChangeWindowState(() => {

    for (const editor of vscode.window.visibleTextEditors) {
      if (!shouldIgnoreDocument(editor.document.uri)) {
        syncDocument(editor.document, deps)
        applyDecorators(editor, store);
      }

    }

  })
  )

  manager.register(vscode.workspace.onDidSaveTextDocument((doc) => {

    if (shouldIgnoreDocument(doc.uri)) return;

    void (async () => {

      flushQueuedDocumentSync(doc, deps);
      await new OnUserSaveFile(doc, deps).SaveTasks();
      deps.treeProvider.refresh();

    })();

  }));

}

export const syncDocument = (doc: vscode.TextDocument, deps: TaskioDependencies): void => {
  const { store, treeProvider, treeView, applyDecorators, updateTreeTitle } = deps;

  if (shouldIgnoreDocument(doc.uri)) {
    store.removeByUri(doc.uri);

    treeProvider.refresh();
    updateTreeTitle(treeView, store);

    return;
  }

  const freshComments = ScanDocument(doc);
  store.replaceByUri(doc.uri, freshComments);

  deps.context.workspaceState.update("taskio.comments", deps.store.getAll());

  treeProvider.refresh();
  updateTreeTitle(treeView, store);

  const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === doc.uri.toString());

  if (editor) applyDecorators(editor, store);
};

function queueSyncDocument(doc: vscode.TextDocument, deps: TaskioDependencies): void {
  const key = doc.uri.toString();
  const existing = pendingDocumentSyncTimers.get(key);

  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    pendingDocumentSyncTimers.delete(key);
    const currentDoc = vscode.workspace.textDocuments.find(d => d.uri.toString() === key) ?? doc;
    syncDocument(currentDoc, deps);
  }, DOCUMENT_SYNC_DEBOUNCE_MS);

  pendingDocumentSyncTimers.set(key, timer);
}

function flushQueuedDocumentSync(doc: vscode.TextDocument, deps: TaskioDependencies): void {
  const key = doc.uri.toString();
  const timer = pendingDocumentSyncTimers.get(key);

  if (timer) {
    clearTimeout(timer);
    pendingDocumentSyncTimers.delete(key);
  }

  const currentDoc = vscode.workspace.textDocuments.find(d => d.uri.toString() === key) ?? doc;
  syncDocument(currentDoc, deps);
}

function clearAllQueuedDocumentSyncs(): void {
  for (const timer of pendingDocumentSyncTimers.values()) {
    clearTimeout(timer);
  }

  pendingDocumentSyncTimers.clear();
}
