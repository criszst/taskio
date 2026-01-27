import * as vscode from 'vscode';

import { TreeItem } from 'vscode';

import path from 'path';

import { CommentStore } from '../store/CommentStore';
import { CommentNode, FileNode, FolderNode, TreeNode } from './TreeNode';

import TreeViewMode from '../types/TreeViewMode';
import TaskioComment from '../types/TaskioComment';



export class TreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  readonly order = { high: 0, medium: 1, low: 2, default: 4 };

  private mode: TreeViewMode = 'tree';

  constructor(private store: CommentStore) { }

  setMode(mode: TreeViewMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.refresh();
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(item: TreeItem) {
    return item;
  }

  getChildren(element: TreeNode): TreeNode[] | Thenable<TreeNode[]> {
    switch (this.mode) {

      case 'list':
        return this.getListMode();

      case 'files':
        return this.getFilesMode(element);

      case 'folders':
        return this.getFoldersMode(element);

      case 'tree':
        return this.getTreeMode(element);

        
      default:
        return this.getTreeMode(element);
    }
  }

  private getListMode(): TreeNode[] {
    return this.store
      .getAll()
      .sort((a, b) => this.order[a.priority] - this.order[b.priority])
      .map(c => new CommentNode(c));
  }



  private getFilesMode(element?: TreeNode): TreeNode[] {
    let comments: TaskioComment[] = this.store.getAll();

    let files: Map<string, FileNode> = new Map<string, FileNode>();


    for (const comment of comments) {
      if (files.has(comment.uri.fsPath)) continue;

      const file: FileNode = new FileNode(comment.uri, path.basename(comment.uri.fsPath));
      files.set(comment.uri.fsPath, file);
    }

    // return the TODO comment if the file has one
    if (element instanceof FileNode) {
      return comments
        .sort((a, b) => this.order[a.priority] - this.order[b.priority])
        .filter(comment => comment.uri.fsPath === element.uri.fsPath)
        .map(comment => new CommentNode(comment));
    }


    return Array.from(files.values());
  }



  private getFoldersMode(element?: TreeNode): TreeNode[] {
    const comments = this.store.getAll();
    const workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspace) return [];

    // ROOT -> FOLDERS
    if (!element) {
      const folders = new Map<string, FolderNode>();

      for (const comment of comments) {
        const folderPath = path.dirname(comment.uri.fsPath);

        if (!folders.has(folderPath)) {
          folders.set(
            folderPath,
            new FolderNode(folderPath, path.basename(folderPath))
          );
        }
      }

      return [...folders.values()];
    }

    // FOLDERS -> COMMENTS
    if (element instanceof FolderNode) {
      return comments
        .filter(comment => {
          const todoFolder = path.dirname(comment.uri.fsPath);
          
          // getting only children
          // just to dont leave the same "TODO" on father and children root
          return todoFolder === element.path; 
        })
        .sort((a, b) => this.order[a.priority] - this.order[b.priority])
        .map(c => new CommentNode(c));
    }

    return [];
  }




  private getTreeMode(element: TreeNode): TreeNode[] | Thenable<TreeNode[]> {
    const comments = this.store.getAll();

    const workspaceFolders = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const ignored = ['node_modules', '.git', 'dist'];


    if (!workspaceFolders) return []

    if (!element) {
      const folders = new Set<string>();

      for (const c of comments) {
        const relative = path.relative(workspaceFolders, c.uri.fsPath);
        const folder = relative.split(path.sep);
        folders.add(folder[0]);
      }

      return Array.from(folders).map(folderName => new FolderNode(path.join(workspaceFolders, folderName), folderName));
    }


    if (element instanceof FolderNode) {
      const nodes = new Map<string, TreeNode>();

      for (const c of comments) {
        if (!c.uri.fsPath.startsWith(element.path)) continue;


        const relative = path.relative(element.path, c.uri.fsPath);
        const parts = relative.split(path.sep);

        if (ignored.includes(parts[0])) continue;

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
      const fileComments = comments.sort((a, b) => this.order[a.priority] - this.order[b.priority]).filter(c => c.uri.fsPath === element.uri.fsPath);
      return fileComments.map(c => new CommentNode(c));
    }

    return [];
  }



}