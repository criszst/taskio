import * as vscode from 'vscode';

import TaskioComment from '../types/TaskioComment';
import TaskioPriority from '../types/TaskioPriority';

import { getIconByPriority, getIconByKeyword } from '../decoration/IconDecorators';

export type TreeNode = FolderNode | FileNode | CommentNode;

export class FolderNode extends vscode.TreeItem {
  constructor(public readonly path: string, public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = vscode.ThemeIcon.Folder;
  }
}

export class FileNode extends vscode.TreeItem {
  constructor(public readonly uri: vscode.Uri, public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);

    this.resourceUri = uri;
    this.iconPath = vscode.ThemeIcon.File;
  }
}

export class CommentNode extends vscode.TreeItem {
  constructor(public readonly comment: TaskioComment) {
    super(comment.displayText ?? comment.text, vscode.TreeItemCollapsibleState.None);

    this.description = `Line ${this.comment.line + 1} - ${this.comment.priority.toUpperCase()}`;
    this.tooltip = `${this.comment.displayText ?? this.comment.text} (Line ${this.comment.line + 1}) - ${this.comment.priority.toUpperCase()}`;

    this.contextValue = 'taskioComment';

    this.command = {
      command: 'taskio.revealComment',
      title: 'Go to Comment',
      arguments: [comment],
    };

    this.resourceUri = comment.uri;
    
    this.iconPath = this.comment.priority !== 'default' ? getIconByPriority(this.comment.priority): getIconByKeyword(comment.keyword);
  }
}

