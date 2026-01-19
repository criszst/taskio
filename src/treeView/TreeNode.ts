import * as vscode from 'vscode';

import TaskioComment from '../types/TaskioComment';

export type TreeNode = | FileNode | CommentNode;

export class FileNode extends vscode.TreeItem {
  constructor(public readonly uri: vscode.Uri, public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);

    this.resourceUri = uri;
    this.iconPath = vscode.ThemeIcon.File;
  }
}

export class CommentNode extends vscode.TreeItem {
  constructor(public readonly comment: TaskioComment) {
    super(comment.text, vscode.TreeItemCollapsibleState.None);

    this.description = `Line ${this.comment.line + 1}`;
    this.tooltip = `${this.comment.keyword}: ${this.comment.text} (Line ${this.comment.line + 1})`;

    this.command = {
      command: 'taskio.revealComment',
      title: 'Go to Comment',
      arguments: [this.comment],
    };

    this.iconPath = getIconByKeyword(comment.keyword);
    this.contextValue = 'taskioComment';
  }
}

function getIconByKeyword(keyword: string): vscode.ThemeIcon {
  switch (keyword.toUpperCase()) {
    case 'BUG':
      return new vscode.ThemeIcon('bug')
    case 'FIXME':
      return new vscode.ThemeIcon('tools')
    case 'TODO':
      return new vscode.ThemeIcon('checklist')
    default:
      return new vscode.ThemeIcon('check')
  }
}