import * as vscode from 'vscode';

import ScanDocument from '../../treeView/scanner/DocumentScanner';
import { ScanWorkspace } from '../../treeView/scanner/WorkspaceScanner';

import shouldIgnoreDocument from '../../config/IgnoredFiles';
import { TaskioDependencies } from '../../types/TaskioDependencies';
import TaskioComment from '../../types/TaskioComment';

import EventManager from '../EventManager';

export function registerWorkspaceHandler(manager: EventManager, deps: TaskioDependencies): void {
  const { store, treeProvider, treeView, updateTreeTitle } = deps;

  manager.register(
    vscode.workspace.onDidRenameFiles(async event => {
      for (const file of event.files) {

        store.removeByUri(file.oldUri);

        if (shouldIgnoreDocument(file.newUri)) return;


        const doc = await vscode.workspace.openTextDocument(file.newUri);
        store.setMany(ScanDocument(doc));
      }

      treeProvider.refresh();
      deps.updateTreeTitle(deps.treeView, deps.store);
    })
  );

  manager.register(
    vscode.workspace.onDidDeleteFiles(event => {
      const file = event.files

      if (file.length === 0) return;

      for (const uri of file) {

        if (shouldIgnoreDocument(uri)) return;

        const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());

        if (doc) {
          store.replaceByUri(uri, ScanDocument(doc));
        } else {
          store.removeByUri(uri);
        }
      }

      treeProvider.refresh();
      deps.updateTreeTitle(deps.treeView, deps.store);
    })
  );

}

export async function verifyWorkspaceChanges(deps: TaskioDependencies, previousComments: TaskioComment[] = []): Promise<void> {
  if (!vscode.workspace.workspaceFolders) return;

  deps.store.clear();
  
  if (previousComments.length > 0) {
    deps.store.setMany(previousComments);
  }


  await ScanWorkspace(deps.store);


  await deps.context.workspaceState.update("taskio.comments", deps.store.getAll());

  deps.treeProvider.refresh();
  deps.updateTreeTitle(deps.treeView, deps.store);

  for (const editor of vscode.window.visibleTextEditors) {
    if (!shouldIgnoreDocument(editor.document.uri)) {
      deps.applyDecorators(editor, deps.store);
    }
  }

}
