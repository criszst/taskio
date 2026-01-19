import * as vscode from 'vscode';
import TaskioComment from '../types/TaskioComment';
import { TreeItem } from './TreeItem';
import { CommentStore } from '../store/CommentStore';
import { CommentNode, FileNode, TreeNode } from './TreeNode';

export class TreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();

  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private store: CommentStore) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(item: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return item;
  }

  getChildren(element?: TreeNode): TreeNode[] | Thenable<TreeNode[]> {
    const comments = this.store.getAll();

    if(!element) {
      const files = new Map<string, vscode.Uri>();

      for (const comment of comments) {
        files.set(comment.uri.fsPath, comment.uri);
      }

      return Array.from(files.entries()).map(([path, uri]) => 
         new FileNode(uri, path.split(/[\\/]/).pop()!)
      );
    }

    if (element instanceof FileNode) {
      return comments
      .filter(comment => comment.uri.fsPath === element.uri.fsPath)
      .map(comment => new CommentNode(comment));
    }

    return [];
  }

}