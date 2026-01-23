import * as vscode from 'vscode';
import TaskioComment from '../types/TaskioComment';

export class TreeItem extends vscode.TreeItem {
  constructor(public readonly comment: TaskioComment) {
    super(comment.text, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${this.comment.keyword}: ${this.comment.text} (Line ${this.comment.line + 1})`;

    this.description = `Line ${this.comment.line + 1} - ${this.comment.priority}`;

    this.command = {
      command: 'taskio.revealComment',
      title: 'Go to Comment',
      arguments: [comment]
    };

    this.iconPath = comment.priority === 'high' ? new vscode.ThemeIcon('flame')
    : comment.priority === 'low'
      ? new vscode.ThemeIcon('circle-slash')
      : new vscode.ThemeIcon('comment');

  }
}