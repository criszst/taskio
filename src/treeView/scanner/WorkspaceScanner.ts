import * as vscode from 'vscode';
import { CommentStore } from '../../store/CommentStore';
import ScanDocument from './DocumentScanner';
import shouldIgnoreDocument from '../../config/IgnoredFiles';

export async function ScanWorkspace(store: CommentStore) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showWarningMessage('Taskio: No workspace folder found to scan.');
    return;
  }

  const files = await vscode.workspace.findFiles(
    '**/*.{js,ts,jsx,tsx,py,java,cs,cpp,go,rb,rs,php,html,css,scss}',
    '**/{node_modules,out,dist,build,.git,.next,coverage}/**',
    undefined
  );
  
  await Promise.all(
    files.map(async file => {
      if (shouldIgnoreDocument(file)) return;
       
      const doc = await vscode.workspace.openTextDocument(file);
      store.setMany(ScanDocument(doc));
    })
  );
}