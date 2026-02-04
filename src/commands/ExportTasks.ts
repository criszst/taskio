import * as vscode from 'vscode';
import { CommentStore } from '../store/CommentStore';

import * as fs from 'fs';
import * as path from 'path';
import ExportToMd from '../utils/exports/ExportToMd';
import ExportToJson from '../utils/exports/ExportToJson';

export default async function ExportTasks(store: CommentStore, format: string): Promise<void> {
  const comments = store.getAll();

  const formats = [
    "txt",
    "md",
    "json"
  ]

  if (!comments.length) {
    vscode.window.showInformationMessage('Taskio: No Tasks found');
    return;
  }

  if (!formats.includes(format)) {
    vscode.window.showErrorMessage(`Taskio: Unsupported export format: ${format}`);
    return;
  }

  switch (format) {
    case "txt": {
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', 'tasks_export.txt')),
        filters: { 'Text Files': ['txt'] },
        saveLabel: 'Export Tasks'
      });

      if (!uri) return;

      fs.writeFileSync(uri.fsPath, comments.map(comment => comment.text).join('\n\n'));

      vscode.window.showInformationMessage(`Taskio: Exported ${comments.length}!`);
      return;
    }

    case "md": {
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', 'tasks_export.md')),
        filters: { 'Markdown Files': ['md'] },
        saveLabel: 'Export Tasks'
      });

      if (!uri) return;

      fs.writeFileSync(uri.fsPath, await ExportToMd(comments), 'utf-8');

      vscode.window.showInformationMessage(`Taskio: Exported ${comments.length}!`);
      return;
    }

    case "json": {
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', 'tasks_export.json')),
        filters: { 'JSON Files': ['json'] },
        saveLabel: 'Export Tasks'
      });

      if (!uri) return;

      fs.writeFileSync(uri.fsPath, await ExportToJson(comments), 'utf-8');

      vscode.window.showInformationMessage(`Taskio: Exported ${comments.length} tasks!`);
      return;
    }

    default:
      vscode.window.showErrorMessage(`Taskio: Unsupported export format: ${format}`);
      return;
  }

}