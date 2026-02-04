import path from "path";
import fs from 'fs';
import { Uri, workspace } from "vscode";

export default function shouldIgnoreDocument(uri: Uri): boolean {
  const fsPath = uri.fsPath;
  
  if (uri.scheme !== 'file') {
    return true;
  }
  

  const workspaceFolders = workspace.workspaceFolders;

  if (workspaceFolders && workspaceFolders.length > 0) {
    const isInWorkspace = workspaceFolders.some(folder => fsPath.startsWith(folder.uri.fsPath));

    if (!isInWorkspace) {
      return true;
    }
  }
  

  const ignoredFolders = [
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
  ];
  
  for (const folder of ignoredFolders) {
    if (fsPath.includes(`${path.sep}${folder}${path.sep}`) ||
        fsPath.endsWith(`${path.sep}${folder}`)) {
      return true;
    }
  }
  
  // FILES EXTENSIONS
  const ignoredExtensions = [
    '.md',
    '.mdx',
    '.txt',
    '.json',
    '.log',
    '.lock',
    '.min.js',
    '.min.css',
    '.map',
    '.d.ts',
    '.git',

    // IMAGES
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.webp',
    '.bmp',

    // DOCS
    '.pdf',
    '.doc',
    '.docx',
    '.zip',
    '.tar',
    '.gz',
    '.rar',
    '.7z',
    '.exe',
    '.dll',
    '.so',
    '.dylib',

    // DB
    '.db',
    '.sqlite',
    '.sqlite3',
  ];
  
  for (const ext of ignoredExtensions) {
    if (fsPath.endsWith(ext)) {
      return true;
    }
  }
  
  // Specific files
  const fileName = path.basename(fsPath);
  const ignoredFiles = [
    // Lock files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'composer.lock',
    'Gemfile.lock',
    'poetry.lock',

    // Config files
    '.gitignore',
    '.dockerignore',
    '.eslintignore',
    '.prettierignore',

    // Environment files
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.test',

    // IDE files
    '.DS_Store',
    'Thumbs.db',
    'desktop.ini',
  ];
  
  if (ignoredFiles.includes(fileName)) {
    return true;
  }
  
 
  const fileExtension = path.extname(fsPath);
  
  if (fileExtension === '') {
    try {
      if (fs.existsSync(fsPath) && fs.statSync(fsPath).isFile()) {
        return true;
      }
    } catch (error) {
      return true;
    }
  }

  
  // files that appear on unix-like systems as hidden files
  if (fileName.startsWith('.') && fileName !== '.') {
    const allowedDotFiles = [
      '.eslintrc.js',
      '.prettierrc.js',
      '.babelrc.js',
    ];
    if (!allowedDotFiles.includes(fileName)) {
      return true;
    }
  }
  
  return false;
}