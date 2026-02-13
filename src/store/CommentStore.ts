import * as vscode from "vscode";

import TaskioComment from "../types/TaskioComment";
import TaskioPriority from "../types/TaskioPriority";


export class CommentStore {
  private comments: Map<string, TaskioComment>;

  constructor() {
    this.comments = new Map<string, TaskioComment>();
  }

  update(comment: TaskioComment): void {
    this.comments.set(comment.id, comment);
  }

  setMany(newComments: TaskioComment[]): void {
    for (const comment of newComments) {
      this.comments.set(comment.id, comment);
    }
  }

  clear(): void {
    this.comments.clear();
  }


  remove(id: string): void {
    this.comments.delete(id);
  }

  removeByUri(uri: vscode.Uri): void {
    for (const [id, comment] of this.comments) {
      if (comment.uri.fsPath === uri.fsPath) {
        this.comments.delete(id);
      }
    }
  }

  replaceByUri(uri: vscode.Uri, comments: TaskioComment[]) {
  this.comments = new Map<string, TaskioComment>(Array.from(this.comments.entries()).filter(([id, comment]) => comment.uri.toString() !== uri.toString()));
  for (const comment of comments) {
    this.comments.set(comment.id, comment);
  }
}


  getAll(): TaskioComment[] {
    return Array.from(this.comments.values());
  }

  getByUri(uri: vscode.Uri): TaskioComment[] {
    return Array.from(this.comments.values()).filter(comment => comment.uri.fsPath === uri.fsPath);
  }

  setPriority(id: string, priority: TaskioPriority): void {
    const comment = this.comments.get(id)

    if (!comment) return;

    comment.priority = priority
    this.comments.set(id, comment);
  }

  getPriority(id: string): string {
    const comment = this.comments.get(id)?.priority ?? 'default';

    return comment
  }

  refresh() {
    this.comments = new Map<string, TaskioComment>(this.comments);
  }
}