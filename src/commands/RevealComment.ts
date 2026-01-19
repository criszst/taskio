import * as vscode from 'vscode'
import TaskioComment from '../types/TaskioComment'

export async function revealComment(comment: TaskioComment) {
  const doc = await vscode.workspace.openTextDocument(comment.uri)
  const editor = await vscode.window.showTextDocument(doc)

  const pos = new vscode.Position(comment.line, comment.character)
  editor.selection = new vscode.Selection(pos, pos)
  editor.revealRange(
    new vscode.Range(pos, pos),
    vscode.TextEditorRevealType.InCenter
  )
}
