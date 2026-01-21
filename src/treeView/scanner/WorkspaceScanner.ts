import * as vscode from 'vscode';
import { CommentStore } from '../../store/CommentStore';
import ScanDocument from './DocumentScanner';

export async function ScanWorkspace(store: CommentStore) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showWarningMessage('Taskio: No workspace folder found to scan.');
    return;
  }

  const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx,py,java,cs,cpp,go,rb,rs,php,html,css,scss,md}', '**/node_modules/**');

  for (const file of  files) {
    const doc = await vscode.workspace.openTextDocument(file);
    store.setMany(ScanDocument(doc));
  }
}