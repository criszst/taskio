import * as vscode from 'vscode';

import ScanDocument from '../../treeView/scanner/DocumentScanner';
import shouldIgnoreDocument from '../../config/IgnoredFiles';
import { TaskioDependencies } from '../../types/TaskioDependencies';
import EventManager from '../EventManager';

export function registerDocumentHandler(manager: EventManager, deps: TaskioDependencies): void {
  const { store, treeProvider, treeView, applyDecorators, updateTreeTitle } = deps;

  const syncDocument = (doc: vscode.TextDocument) => {
    if (shouldIgnoreDocument(doc.uri)) return;

      store.replaceByUri(doc.uri, ScanDocument(doc));

      treeProvider.refresh();
      updateTreeTitle(treeView, store);

      const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === doc.uri.toString());

      if (editor) applyDecorators(editor, store);
  };

  manager.register(
    vscode.workspace.onDidOpenTextDocument(syncDocument)
  );

  manager.register(
    vscode.workspace.onDidChangeTextDocument(event => {
      syncDocument(event.document);
    })
  );

}