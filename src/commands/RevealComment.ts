import * as vscode from 'vscode'
import TaskioComment from '../types/TaskioComment'

export async function RevealComment(comment: TaskioComment) {
  if (!comment) return vscode.window.showWarningMessage('Taskio: No comment selected.');

  const doc = await vscode.workspace.openTextDocument(comment.uri)
  const editor = await vscode.window.showTextDocument(doc)

  const position = new vscode.Position(
    comment.line,
    comment.character
  )

  editor.selection = new vscode.Selection(position, position)

  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenter
  )
}
