import * as vscode from 'vscode';
import shouldIgnoreDocument from '../../config/IgnoredFiles';

import { CommentStore } from '../../store/CommentStore';
import { TaskioDependencies } from '../../types/TaskioDependencies';
import EventManager from '../EventManager';

export function registerEditorHandler(manager: EventManager, deps: TaskioDependencies): void {

  manager.register(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (!editor) return;

      if (shouldIgnoreDocument(editor.document.uri)) return;

      deps.applyDecorators(editor, deps.store);
    })
  );

  manager.register(
    vscode.window.onDidChangeWindowState(windowState => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      if (windowState.focused) deps.applyDecorators(editor, deps.store);
    })
  );

}
