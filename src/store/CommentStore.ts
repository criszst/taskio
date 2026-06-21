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
    for (const newC of newComments) {
        const existing = Array.from(this.comments.values()).find(old => 
            old.uri.fsPath === newC.uri.fsPath && 
            old.text === newC.text &&
            Math.abs(old.line - newC.line) < 3
        );

        if (existing && existing.syncStatus === "synced") {
            newC.syncStatus = "synced";
            newC.trelloCardId = existing.trelloCardId;
            newC.priority = existing.priority;
            newC.id = existing.id;
        }

        this.comments.set(newC.id, newC);
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

  replaceByUri(uri: vscode.Uri, newComments: TaskioComment[]) {
  const oldComments = this.getByUri(uri);

  this.comments = new Map(
    Array.from(this.comments.entries()).filter(
      ([id, c]) => c.uri.toString() !== uri.toString()
    )
  );


  for (const newC of newComments) {
    const existing = oldComments.find(old => 
      old.text === newC.text && 
      Math.abs(old.line - newC.line) < 5
    );

    if (existing) {
      newC.syncStatus = existing.syncStatus;
      newC.trelloCardId = existing.trelloCardId;
      newC.priority = existing.priority;
      newC.id = existing.id;
    }

    this.comments.set(newC.id, newC);
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
