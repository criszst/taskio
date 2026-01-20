import * as vscode from 'vscode';
import TaskioComment from '../types/TaskioComment';

export class TreeItem extends vscode.TreeItem {
  constructor(public readonly comment: TaskioComment) {
    super(comment.text, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${this.comment.keyword}: ${this.comment.text} (Line ${this.comment.line + 1})`;
    this.description = `Line ${this.comment.line + 1}`;
    this.command = {
      command: 'taskio.revealComment',
      title: 'Go to Comment',
      arguments: [comment]
    };

    this.iconPath = new vscode.ThemeIcon('comment-discussion');
  }
}