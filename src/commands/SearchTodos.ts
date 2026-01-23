import * as vscode from 'vscode';
import TaskioComment from '../types/TaskioComment';
import { CommentStore } from '../store/CommentStore';
import path from 'path';
import { RevealComment } from './RevealComment';

export async function SearchTodos(store: CommentStore) {
  const comments = store.getAll();
  const order = { high: 0, medium: 1, low: 2, default: 4, };

  if (!comments.length) {
    vscode.window.showInformationMessage('Taskio: No TODOs found');
    return;
  }

  const items: (vscode.QuickPickItem & { comment: TaskioComment })[] =
    comments.sort((a, b) => order[a.priority] - order[b.priority]).map(comment => {
      const file = path.basename(comment.uri.fsPath);

      return {
        label: `${comment.displayText ?? comment.text}`,
        description: `${file}:${comment.line + 1} - ${comment.priority.toUpperCase()}`,
        comment
      };
    });

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Search TODOs (type to filter)'
  });

  if (!picked || !picked.comment) return;

  await RevealComment(picked.comment);

}