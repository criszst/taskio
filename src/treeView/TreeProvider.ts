import * as vscode from 'vscode';

import { TreeItem } from 'vscode';

import { CommentStore } from '../store/CommentStore';
import { TreeNode } from './TreeNode';

import TreeViewMode from '../types/TreeViewMode';
import TreeMode from './TreeMode';



export class TreeProvider implements vscode.TreeDataProvider<TreeNode>{
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private showStatistics: boolean = true;


  private mode: TreeViewMode = 'tree';
  readonly treeMode: TreeMode;


  readonly order = { high: 0, medium: 1, low: 2, default: 4 };


  constructor(private store: CommentStore) {
    this.treeMode = new TreeMode(this.store);

    const config = vscode.workspace.getConfiguration('taskio');
    this.showStatistics = config.get('showStatistics', true);
  }


  setMode(mode: TreeViewMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.refresh();
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(item: TreeItem): TreeItem | Thenable<TreeItem> {
    return item;
  }

  getChildren(element: TreeNode): TreeNode[] | Thenable<TreeNode[]> {
    switch (this.mode) {

      case 'list':
        return this.treeMode.getListMode();

      case 'files':
        return this.treeMode.getFileMode(element);

      case 'folders':
        return this.treeMode.getFoldersMode(element);

      case 'tree':
        return this.treeMode.getTreeMode(element);


      default:
        return this.treeMode.getTreeMode(element);
    }
  }

}