import * as vscode from 'vscode';
import TaskioComment from '../types/TaskioComment';
import { CommentStore } from '../store/CommentStore';
import path from 'path';
import { RevealComment } from './RevealComment';

export async function SearchTodos(store: CommentStore) {
  const comments = store.getAll();

  if (!comments.length) {
    vscode.window.showInformationMessage('Taskio: No TODOs found');
    return;
  }

  const items: (vscode.QuickPickItem & { comment: TaskioComment })[] =
    comments.map(comment => {
      const file = path.basename(comment.uri.fsPath);

      return {
        label: `${comment.keyword}: ${comment.text}`,
        description: `${file}:${comment.line + 1}`,
        comment
      };
    });

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Search TODOs (type to filter)'
  });

  if (!picked || !picked.comment) return;

  await RevealComment(picked.comment);

}