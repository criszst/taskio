import * as vscode from "vscode";
import path from "path";

import TaskioComment from "../types/TaskioComment";

import { TreeItem } from "vscode";
import { CommentStore } from "../store/CommentStore";
import { CommentNode, FileNode, FolderNode, TreeNode } from "./TreeNode";
import { TreeProvider } from "./TreeProvider";

export default class TreeMode {

  constructor(private store: CommentStore) { }

  private readonly priorityOrder = {
    high: 0,
    medium: 1,
    low: 2,
    default: 3,
  };

  private readonly syncOrder = {
    error: 0,
    never_synced: 1,
    modified: 2,
    syncing: 3,
    synced: 4,
  };

  private compareTasks = (a: TaskioComment, b: TaskioComment): number => {
    const priorityDiff = this.priorityOrder[a.priority] - this.priorityOrder[b.priority];

    if (priorityDiff !== 0) return priorityDiff;

    const syncDiff = 
    (this.syncOrder[a.syncStatus] ?? this.syncOrder.never_synced) 
    - (this.syncOrder[b.syncStatus] ?? this.syncOrder.never_synced);

    if (syncDiff !== 0) return syncDiff;

    const fileDiff = a.uri.fsPath.localeCompare(b.uri.fsPath);

    if (fileDiff !== 0) return fileDiff;

    if (a.line !== b.line) return a.line - b.line;

    if (a.character !== b.character) {
      return a.character - b.character;
    }

    return a.id.localeCompare(b.id);
  };

  public getListMode() {
    return this.store
      .getAll()
      .sort(this.compareTasks)
      .map(c => new CommentNode(c));
  }

  public getFileMode(element: TreeItem): TreeNode[] {
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
        .filter(comment => comment.uri.fsPath === element.uri.fsPath)
        .sort(this.compareTasks)
        .map(comment => new CommentNode(comment));
    }


    return this.sortNodes(Array.from(files.values()));
  }

  public getFoldersMode(element?: TreeItem): TreeNode[] {
    const comments = this.store.getAll();
    const workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspace) return [];

    // ROOT
    if (!element) {
      const nodes = new Map<string, TreeNode>();

      for (const c of comments) {
        const relative = path.relative(workspace, c.uri.fsPath);
        const parts = relative.split(path.sep);

        if (parts.length === 1) {
          nodes.set(
            c.uri.fsPath,
            new FileNode(c.uri, parts[0])
          );
        }

        else if (parts.length === 2) {
          const folderName = parts[0];
          const folderPath = path.join(workspace, folderName);

          nodes.set(
            folderPath,
            new FolderNode(folderPath, folderName)
          );
        }

        else {
          const folderName = parts[parts.length - 2];
          const folderPath = path.join(workspace, folderName);

          nodes.set(
            folderPath,
            new FolderNode(folderPath, folderName)
          );
        }
      }

      return this.sortNodes(Array.from(nodes.values()));
    }

    // FOLDER
    if (element instanceof FolderNode) {
      return comments
        .filter(c => {
          const relative = path.relative(workspace, c.uri.fsPath);
          const parts = relative.split(path.sep);

          if (parts.length === 1) return false;

          if (parts.length === 2) {

            return parts[0] === element.label;
          }

        
          return parts[parts.length - 2] === element.label;
        })
        .sort(this.compareTasks)
        .map(c => new CommentNode(c));
    }

    // FILE
    if (element instanceof FileNode) {
      return comments
        .filter(c => c.uri.fsPath === element.uri.fsPath)
        .sort(this.compareTasks)
        .map(c => new CommentNode(c));
    }



    return [];
  }

  public getTreeMode(element: TreeNode): TreeNode[] | Thenable<TreeNode[]> {
    const comments = this.store.getAll();

    const workspaceFolders = vscode.workspace.workspaceFolders?.[0].uri.fsPath;


    if (!workspaceFolders) return []

    if (!element) {
      const nodes = new Map<string, TreeNode>();

      for (const c of comments) {
        const relative = path.relative(workspaceFolders, c.uri.fsPath);
        const parts = relative.split(path.sep);

        if (parts.length === 1) {

          nodes.set(c.uri.fsPath, new FileNode(c.uri, parts[0]));
        } else {

          const folderPath = path.join(workspaceFolders, parts[0]);
          nodes.set(folderPath, new FolderNode(folderPath, parts[0]));
        }
      }

      return this.sortNodes(Array.from(nodes.values()));

    }


    if (element instanceof FolderNode) {
      const nodes = new Map<string, TreeNode>();

      for (const c of comments) {
        if (!c.uri.fsPath.startsWith(element.path + path.sep)) continue;

        const relative = path.relative(element.path, c.uri.fsPath);
        const parts = relative.split(path.sep);

        if (parts.length === 1) {

          nodes.set(
            c.uri.fsPath,
            new FileNode(c.uri, parts[0])
          );
        } else {

          const subFolderPath = path.join(element.path, parts[0]);
          nodes.set(
            subFolderPath,
            new FolderNode(subFolderPath, parts[0])
          );
        }
      }

      return this.sortNodes(Array.from(nodes.values()));
    }


    if (element instanceof FileNode) {
      const fileComments = comments.filter(c => c.uri.fsPath === element.uri.fsPath).sort(this.compareTasks);
      return fileComments.map(c => new CommentNode(c));
    }

    return [];
  }

  private sortNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes.sort((a, b) => {
      if (a instanceof FolderNode && !(b instanceof FolderNode)) return -1;
      if (!(a instanceof FolderNode) && b instanceof FolderNode) return 1;

      return (a.label ?? '').toString().localeCompare(
        (b.label ?? '').toString()
      );
    });
  }

}
