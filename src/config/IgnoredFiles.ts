import path from "path";
import { Uri, workspace } from "vscode";
import { SUPPORTED_EXTENSIONS } from "../treeView/scanner/WorkspaceScanner";

const IGNORED_FOLDERS = new Set([
  'node_modules',
  'dist',
  'out',
  'build',
  '.git',
  '.vscode',
  '.next',
  '.nuxt',
  'coverage',
  '.cache',
  '__pycache__',
  'vendor',
  'target',
  'bin',
  'obj',
  '.angular',
  '.svelte-kit',
  'public',
  'static',
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'composer.lock',
  'Gemfile.lock',
  'poetry.lock',
  '.gitignore',
  '.dockerignore',
  '.eslintignore',
  '.prettierignore',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
]);

const ALLOWED_DOTFILES = new Set([
  '.eslintrc.js',
  '.prettierrc.js',
  '.babelrc.js',
]);

export default function shouldIgnoreDocument(uri: Uri): boolean {
  if (uri.scheme !== 'file') return true;

  const fsPath = uri.fsPath;
  const fileName = path.basename(fsPath);


  const workspaceFolders = workspace.workspaceFolders;
  if (workspaceFolders?.length) {
    const isInWorkspace = workspaceFolders.some(folder =>
      fsPath.startsWith(folder.uri.fsPath)
    );
    if (!isInWorkspace) return true;
  }

  // ignored folders
  const parts = fsPath.split(path.sep);
  if (parts.some(part => IGNORED_FOLDERS.has(part))) {
    return true;
  }

  // ignored specific files
  if (IGNORED_FILES.has(fileName)) {
    return true;
  }

  // hidden dotfiles
  if (fileName.startsWith('.') && !ALLOWED_DOTFILES.has(fileName)) {
    return true;
  }

  const ext = path.extname(fsPath).substring(1);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
  return true;
}

  return false;
}
