import * as vscode from "vscode";

import TaskioComment from "../types/TaskioComment";

export class CommentStore {
  private comments: Map<string, TaskioComment>;

  constructor() {
    this.comments = new Map<string, TaskioComment>();
  }

  setMany(newComments: TaskioComment[]): void {
    for (const comment of newComments) {
      this.comments.set(comment.id, comment);
    }
  }

  removeByUri(uri: vscode.Uri): void {
    for (const [id, comment] of this.comments) {
      if (comment.uri.fsPath === uri.fsPath) {
        this.comments.delete(id);
      }
    }
  }

  getAll(): TaskioComment[] {
    return Array.from(this.comments.values());
  }

}