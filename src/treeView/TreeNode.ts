import * as vscode from 'vscode';

import TaskioComment from '../types/TaskioComment';

import { getIconByPriority, getIconByKeyword, getIconBySynced } from '../decoration/IconDecorators';

export type TreeNode = FolderNode | FileNode | CommentNode;


/**
 * Constructs a new FolderNode
 * @param path the path of the folder
 * @param label the label of the folder
 */
export class FolderNode extends vscode.TreeItem {
  constructor(public readonly path: string, public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = vscode.ThemeIcon.Folder;
  }
}


/**
 * Represents a file in the tree view.
 * 
 * @property  {Uri} uri - The uri of the file.
 * 
 * @property  {string} label - The label of the file.
 */

export class FileNode extends vscode.TreeItem {
  constructor(public readonly uri: vscode.Uri, public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);

    this.resourceUri = uri;
    this.iconPath = vscode.ThemeIcon.File;
  }
}

/**
 * Creates a new CommentNode on Tree View.
 *
 * @param {TaskioComment} comment - The comment to represent.
 * 
 */

export class CommentNode extends vscode.TreeItem {

  constructor(public readonly comment: TaskioComment) {
    super(comment.displayText ?? comment.text, vscode.TreeItemCollapsibleState.None);

    this.description = `Line ${this.comment.line + 1} - ${this.comment.priority.toUpperCase()}`;
    this.tooltip = `${this.comment.displayText ?? this.comment.text} (Line ${this.comment.line + 1}) - ${this.comment.priority.toUpperCase()}`;

    this.contextValue = this.comment.syncStatus === 'synced' 
    ? 'taskioCommentSynced' 
    : 'taskioComment';

    this.command = {
      command: 'taskio.RevealComment',
      title: 'Go to Comment',
      arguments: [comment],
    };

    this.resourceUri = comment.uri;
 
    this.iconPath = this.determineIcon();
  }

  private determineIcon() {
    if (this.comment.syncStatus === 'synced') {
      return getIconBySynced(this.comment.syncStatus, this.comment.priority);
    }

    return this.comment.priority === 'default' ? getIconByKeyword(this.comment) : getIconByPriority(this.comment.priority);

  }

}

