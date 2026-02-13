import * as vscode from 'vscode';

import { TreeItem } from 'vscode';

import { CommentStore } from '../store/CommentStore';
import { TreeNode } from './TreeNode';

import TreeViewMode from '../types/TreeViewMode';
import TreeMode from './TreeMode';
import updateTreeTitle from '../utils/TreeTitle';



export class TreeProvider implements vscode.TreeDataProvider<TreeNode>{
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;


  private mode: TreeViewMode = 'tree';
  readonly treeMode: TreeMode;

  private treeView?: vscode.TreeView<TreeItem>;


  readonly order = { high: 0, medium: 1, low: 2, default: 4 };


  constructor(private store: CommentStore) {
    this.treeMode = new TreeMode(this.store);
  }

  attachTreeView(treeView: vscode.TreeView<TreeItem>) {
  this.treeView = treeView;
  this.updateTitle();
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
        this.updateTitle();
        return this.treeMode.getListMode();

      case 'files':
        this.updateTitle();
        return this.treeMode.getFileMode(element);

      case 'folders':
        this.updateTitle();
        return this.treeMode.getFoldersMode(element);

      case 'tree':
        this.updateTitle();
        return this.treeMode.getTreeMode(element);


      default:
        return this.treeMode.getTreeMode(element);
    }
  }

  private updateTitle() {
  if (!this.treeView) return;

  const count = this.store.getAll().length;

  const titles = {
    list: 'List View',
    files: 'Files View',
    folders: 'Folders View',
    tree: 'Tree View'
  };

  this.treeView.title = `${titles[this.mode]} (${count})`;
}


}