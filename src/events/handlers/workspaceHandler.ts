import * as vscode from 'vscode';

import ScanDocument from '../../treeView/scanner/DocumentScanner';
import { ScanWorkspace } from '../../treeView/scanner/WorkspaceScanner';

import shouldIgnoreDocument from '../../config/IgnoredFiles';
import { TaskioDependencies } from '../../types/TaskioDependencies';

import EventManager from '../EventManager';


export function registerWorkspaceHandler(manager: EventManager, deps: TaskioDependencies): void {
  const { store, treeProvider, treeView, updateTreeTitle } = deps;

  manager.register(
    vscode.workspace.onDidRenameFiles(async event => {
      for (const file of event.files) {
        if (shouldIgnoreDocument(file.oldUri)) continue;
        if (shouldIgnoreDocument(file.newUri)) continue;

        // removing old state
        store.removeByUri(file.oldUri);

        // adding new state
        const doc = await vscode.workspace.openTextDocument(file.newUri);
        store.setMany(ScanDocument(doc));
      }

      treeProvider.refresh();
      updateTreeTitle(treeView, store);
    })
  );

  manager.register(
    vscode.workspace.onDidDeleteFiles(event => {
      const file = event.files

      if (file.length === 0) return;

      for (const uri of event.files) {
        if (shouldIgnoreDocument(uri)) return;

        const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
        if (doc) {
          store.replaceByUri(uri, ScanDocument(doc));
        } else {
          store.removeByUri(uri);
        }
      }

      treeProvider.refresh();
      updateTreeTitle(treeView, store);
    })
  );

}

export async function verifyWorkspaceChanges(deps: TaskioDependencies): Promise<void> {
  if (!vscode.workspace.workspaceFolders) return;

  await ScanWorkspace(deps.store);
  deps.treeProvider.refresh();

  for (const editor of vscode.window.visibleTextEditors) {
    if (!shouldIgnoreDocument(editor.document.uri)) {
      deps.applyDecorators(editor, deps.store);
    }
  }
}