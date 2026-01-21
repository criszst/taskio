import * as vscode from 'vscode';

import TaskioComment from '../types/TaskioComment';

export default function CopyComment(comment: TaskioComment) {
  if (!comment) return vscode.window.showWarningMessage('Taaskio: No comment selected to copy.');
  
  vscode.env.clipboard.writeText(comment.text);
  console.log(`Copied comment: ${comment.text}`);
  vscode.window.showInformationMessage('Taaskio: Comment copied to clipboard!');
}