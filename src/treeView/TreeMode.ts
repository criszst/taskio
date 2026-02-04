import * as vscode from "vscode";
import path from "path";

import TaskioComment from "../types/TaskioComment";

import { TreeItem } from "vscode";
import { CommentStore } from "../store/CommentStore";
import { CommentNode, FileNode, FolderNode, TreeNode } from "./TreeNode";


export default class TreeMode {
  readonly order = { high: 0, medium: 1, low: 2, default: 4 };

  constructor(private store: CommentStore) { }

  public getListMode() {
    return this.store
      .getAll()
      .sort((a, b) => this.order[a.priority] - this.order[b.priority])
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
        .sort((a, b) => this.order[a.priority] - this.order[b.priority])
        .filter(comment => comment.uri.fsPath === element.uri.fsPath)
        .map(comment => new CommentNode(comment));
    }


    return Array.from(files.values());
  }

  public getFoldersMode(element: TreeItem): TreeNode[] {
    const comments = this.store.getAll();
    const workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!workspace) return [];

    // ROOT - FOLDERS/FILES
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
        } else {
          
          const folderPath = path.join(workspace, parts[0]);
          nodes.set(
            folderPath,
            new FolderNode(folderPath, parts[0])
          );
        }
      }

      return Array.from(nodes.values());
    }

    // FOLDER / FILES 
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

      return Array.from(nodes.values());
    }

    // FILE
    if (element instanceof FileNode) {
      return comments
        .filter(comment => comment.uri.fsPath === element.uri.fsPath)
        .sort((a, b) => this.order[a.priority] - this.order[b.priority])
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
          
          nodes.set(
            c.uri.fsPath,
            new FileNode(c.uri, parts[0])
          );
        } else {
    
          const folderPath = path.join(workspaceFolders, parts[0]);
          nodes.set(
            folderPath,
            new FolderNode(folderPath, parts[0])
          );
        }
      }

      return Array.from(nodes.values());
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

      return Array.from(nodes.values());
    }


    if (element instanceof FileNode) {
      const fileComments = comments.sort((a, b) => this.order[a.priority] - this.order[b.priority]).filter(c => c.uri.fsPath === element.uri.fsPath);
      return fileComments.map(c => new CommentNode(c));
    }

    return [];
  }
}