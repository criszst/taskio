import * as vscode from 'vscode';

import ScanDocument from '../../treeView/scanner/DocumentScanner';
import shouldIgnoreDocument from '../../config/IgnoredFiles';
import { TaskioDependencies } from '../../types/TaskioDependencies';
import EventManager from '../EventManager';

export function registerDocumentHandler(manager: EventManager, deps: TaskioDependencies): void {
  const { store, treeProvider, treeView, applyDecorators, updateTreeTitle } = deps;

   manager.register(
    vscode.workspace.onDidOpenTextDocument(doc => {
      if (shouldIgnoreDocument(doc.uri)) return;

      store.setMany(ScanDocument(doc));
      treeProvider.refresh();
      updateTreeTitle(treeView, store);
    })
  );

  manager.register(
    vscode.workspace.onDidChangeTextDocument(event => {
     const doc = event.document;
      if (shouldIgnoreDocument(doc.uri)) return;

      store.removeByUri(doc.uri);
      store.setMany(ScanDocument(doc));

      treeProvider.refresh();
      updateTreeTitle(treeView, store);

      const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);

      if (editor) applyDecorators(editor, store);
    })
  );

  manager.register(
    vscode.workspace.onDidCloseTextDocument(doc => {
      if (shouldIgnoreDocument(doc.uri)) return;

      store.removeByUri(doc.uri);

      treeProvider.refresh();
      updateTreeTitle(treeView, store);
    })
  );

}