import * as vscode from 'vscode';
import { CommentStore } from '../../store/CommentStore';
import ScanDocument from './DocumentScanner';
import shouldIgnoreDocument from '../../config/IgnoredFiles';

export const SUPPORTED_EXTENSIONS = [
  'ts','js','tsx','jsx',
  'py','java','cs', 'csharp', 'vb',
  'cpp','c','h',
  'go','rs','php','rb',
  'swift','kt',
  'html','css','scss',
  'yaml','yml','toml',
  'r','rmd'
];

const EXCLUDED_GLOB =
  '**/{node_modules,dist,out,build,.git,.vscode,.next,.nuxt,coverage,.cache,__pycache__,vendor,target,bin,obj,.angular,.svelte-kit}/**';

export async function ScanWorkspace(store: CommentStore) {
  const folders = vscode.workspace.workspaceFolders;

  if (!folders?.length) {
    vscode.window.showWarningMessage('Taskio: No workspace folder found to scan.');
    return;
  }

  const pattern = `**/*.{${SUPPORTED_EXTENSIONS.join(',')}}`;

  const allFiles = await Promise.all(
    folders.map(folder =>
      vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, pattern),
        EXCLUDED_GLOB
      )
    )
  );

  const flatFiles = allFiles.flat();

  for (const file of flatFiles) {
    if (shouldIgnoreDocument(file)) continue;

    try {
      const doc = await vscode.workspace.openTextDocument(file);
      const comments = ScanDocument(doc);

      if (comments.length) {
        store.setMany(comments);
      }

    } catch (err) {
      console.error('Taskio scan error:', err);
    }
  }
}
