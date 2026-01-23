import * as vscode from 'vscode';
import TaskioComment from '../types/TaskioComment';
import { TreeItem } from './TreeItem';
import { CommentStore } from '../store/CommentStore';
import { CommentNode, FileNode, FolderNode, TreeNode } from './TreeNode';
import path from 'path';

export class TreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();

  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private store: CommentStore) { }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(item: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return item;
  }

  getChildren(element?: TreeNode): TreeNode[] | Thenable<TreeNode[]> {
    const comments = this.store.getAll();
    const order = { high: 0, medium: 1, low: 2, default: 4, };

    const workspaceFolders = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    

    if (!workspaceFolders) return []

    if (!element) {
      const folders = new Set<string>();

      for (const c of comments) {
        const relative = path.relative(workspaceFolders, c.uri.fsPath);
        const folder = relative.split(path.sep);
        folders.add(folder[0]);
      }

      return Array.from(folders).map(folderName => new FolderNode(path.join(workspaceFolders, folderName), folderName) );
    }


    if (element instanceof FolderNode) {
      const nodes = new Map<string, TreeNode>();

      for (const c of comments) {
        if (!c.uri.fsPath.startsWith(element.path)) continue;

        const relative = path.relative(element.path, c.uri.fsPath);
        const parts = relative.split(path.sep);

        if (parts.length > 1) {
          const subPart = path.join(element.path, parts[0]);
          nodes.set(subPart, new FolderNode(subPart, parts[0]));
        }

        else {
          nodes.set(c.uri.fsPath, new FileNode(c.uri, path.basename(c.uri.fsPath)));
        }
      }

      return Array.from(nodes.values());
    }


    if (element instanceof FileNode) {
      const fileComments = comments.sort((a, b) => order[a.priority] - order[b.priority]).filter(c => c.uri.fsPath === element.uri.fsPath);
      return fileComments.map(c => new CommentNode(c));
    }

    return [];
  }

}