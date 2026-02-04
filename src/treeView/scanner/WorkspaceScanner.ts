import * as vscode from 'vscode';
import { CommentStore } from '../../store/CommentStore';
import ScanDocument from './DocumentScanner';
import shouldIgnoreDocument from '../../config/IgnoredFiles';

export async function ScanWorkspace(store: CommentStore) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showWarningMessage('Taskio: No workspace folder found to scan.');
    return;
  }

    const extensions = [
    // Assembly
    'asm', 's', 'S',

    // JavaScript/TypeScript
    'js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs',

    // Python
    'py', 'pyw',

    // Java/C#
    'java', 'cs',

    // C/C++
    'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx',

    // Go/Rust
    'go', 'rs',

    // Ruby/PHP
    'rb', 'php',

    // Web
    'html', 'htm', 'css', 'scss', 'sass', 'less',

    // Frameworks
    'vue', 'svelte',

    // Shell
    'sh', 'bash',

    // SQL
    'sql',

    // S,
    'swift',

    // Kotlin
    'kt', 'kts'
  ];

  const files = await vscode.workspace.findFiles(
    `**/*.{${extensions.join(',')}}`,
    '**/{node_modules,out,dist,build,.git,.vscode,.next,.nuxt,coverage,.cache,__pycache__,vendor,target,bin,obj}/**',
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