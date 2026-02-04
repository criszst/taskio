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
      const folders = new Map<string, FolderNode>();
      const rootFiles = new Map<string, FileNode>();

      for (const comment of comments) {
        const folderPath = path.dirname(comment.uri.fsPath);

        // Files without SubFolder (on ROOT)
        if (folderPath === workspace) {

          if (!rootFiles.has(comment.uri.fsPath)) {
            rootFiles.set(comment.uri.fsPath, new FileNode(comment.uri, path.basename(comment.uri.fsPath)));
          }

        }
        // Files on SubFolder
        else {
          const displayName = path.basename(folderPath);

          if (!folders.has(folderPath)) {
            folders.set(folderPath, new FolderNode(folderPath, displayName));
          }
        }
      }

      return [...rootFiles.values(), ...folders.values()];
    }

    // FOLDER / FILES 
    if (element instanceof FolderNode) {
      const files = new Map<string, FileNode>();

      for (const comment of comments) {
        const todoFolder = path.dirname(comment.uri.fsPath);

        if (todoFolder === element.path) {
          if (!files.has(comment.uri.fsPath)) {
            files.set(
              comment.uri.fsPath,
              new FileNode(comment.uri, path.basename(comment.uri.fsPath))
            );
          }
        }
      }

      return Array.from(files.values());
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
    const workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    const workspaceFolders = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const ignored = ['node_modules', '.git', 'dist'];


    if (!workspaceFolders) return []

    if (!element) {
      const folders = new Map<string, FolderNode>();
      const rootFiles = new Map<string, FileNode>();

      for (const comment of comments) {
        const folderPath = path.dirname(comment.uri.fsPath);

        // Files without SubFolder (on ROOT)
        if (folderPath === workspace) {

          if (!rootFiles.has(comment.uri.fsPath)) {
            rootFiles.set(comment.uri.fsPath, new FileNode(comment.uri, path.basename(comment.uri.fsPath)));
          }

        }
        // Files on SubFolder
        else {
          const displayName = path.basename(folderPath);

          if (!folders.has(folderPath)) {
            folders.set(folderPath, new FolderNode(folderPath, displayName));
          }
        }
      }

      return [...rootFiles.values(), ...folders.values()];

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