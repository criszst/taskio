import * as vscode from 'vscode';
import shouldIgnoreDocument from '../../config/IgnoredFiles';

import { CommentStore } from '../../store/CommentStore';
import { TaskioDependencies } from '../../types/TaskioDependencies';
import EventManager from '../EventManager';
import ScanDocument from '../../treeView/scanner/DocumentScanner';
import { ScanWorkspace } from '../../treeView/scanner/WorkspaceScanner';
import { syncDocument } from './documentHandler';

export function registerEditorHandler(manager: EventManager, deps: TaskioDependencies): void {

  manager.register(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (!editor) return;

      if (shouldIgnoreDocument(editor.document.uri)) return;

      syncDocument(editor.document, deps);
    })
  );

  manager.register(
    vscode.window.onDidChangeWindowState(windowState => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      if (windowState.focused) syncDocument(editor.document, deps);
    })
  );

}
