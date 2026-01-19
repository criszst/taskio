import * as vscode from 'vscode';

import TaskioComment from '../types/TaskioComment';

export default function CopyComment(comment: TaskioComment) {
  vscode.env.clipboard.writeText(comment.text);
  vscode.window.showInformationMessage('Taaskio: Comment copied to clipboard!');
}