import path from "path";
import { Uri } from "vscode";

export default function shouldIgnoreDocument(uri: Uri): boolean {
  const fsPath = uri.fsPath;

  return (
    fsPath.includes('node_modules') ||
    fsPath.includes(`${path.sep}dist${path.sep}`) ||
    fsPath.includes(`${path.sep}out${path.sep}`) ||
    fsPath.includes(`${path.sep}.vscode${path.sep}`)
  );
}
