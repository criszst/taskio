import * as vscode from 'vscode';

import ScanDocument from '../../treeView/scanner/DocumentScanner';
import shouldIgnoreDocument from '../../config/IgnoredFiles';
import { TaskioDependencies } from '../../types/TaskioDependencies';
import EventManager from '../EventManager';
import debounce from '../../utils/Debounce';

export function registerDocumentHandler(manager: EventManager, deps: TaskioDependencies): void {
  const { store, applyDecorators } = deps;

  manager.register(
    vscode.workspace.onDidOpenTextDocument(event => syncDocument(event, deps), 200)
  );

  manager.register(
    vscode.workspace.onDidChangeTextDocument(event =>  syncDocument(event.document, deps), 200)
  );

  manager.register(
    vscode.window.onDidChangeWindowState(() => {

      for (const editor of vscode.window.visibleTextEditors) {
        if (!shouldIgnoreDocument(editor.document.uri)) {
          syncDocument(editor.document, deps) 
          applyDecorators(editor, store);
        }
      }

    })
  )
}

 export const syncDocument = (doc: vscode.TextDocument, deps: TaskioDependencies): void => {
  const { store, treeProvider, treeView, applyDecorators, updateTreeTitle } = deps;

    if (shouldIgnoreDocument(doc.uri)) {
      store.removeByUri(doc.uri);

      treeProvider.refresh();
      updateTreeTitle(treeView, store);

      return;
    }

    store.replaceByUri(doc.uri, ScanDocument(doc));

    (async () => await deps.context.workspaceState.update("taskio.comments", deps.store.getAll()))();
    
    treeProvider.refresh();
    updateTreeTitle(treeView, store);

    const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === doc.uri.toString());

    if (editor) applyDecorators(editor, store);
  };