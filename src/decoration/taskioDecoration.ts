import * as vscode from 'vscode'
import { getTaskioConfig } from '../config/taskioConfig'
import { isLikelyComment } from '../parser/commentDetector'

let decorationType: vscode.TextEditorDecorationType

/**
 * Applies Taskio decorations to the given TextEditor.
 *
 * @param editor - the TextEditor to apply the decorations to.
 */

// TODO: Optimize decoration application for large files
// like by use ternary operator to choose regex based on enhanceAllText, but i'll go with this for now

export function applyTaskioDecorations(editor: vscode.TextEditor): void {
  const { keywords }: { keywords: string[]; } = getTaskioConfig()
  const { color }: { color: string; } = getTaskioConfig()
  const { enhanceAllText }: { enhanceAllText: boolean; } = getTaskioConfig()


  if (decorationType) decorationType.dispose()

  decorationType = vscode.window.createTextEditorDecorationType({ color, fontWeight: 'bold' })

  const keywordRegex = keywords.join('|')
  let regex: RegExp = new RegExp(`(?<![A-Z0-9_])(${keywordRegex})(?=\\s*[:\\-])`, 'gi')


  const decorationsRange: vscode.DecorationOptions[] = []

  for (let line = 0; line < editor.document.lineCount; line++) {
    const lineText = editor.document.lineAt(line).text

    if (!isLikelyComment(lineText)) continue

    let match: RegExpExecArray | null;
    let vsRange: vscode.Range;


    while ((match = regex.exec(lineText))) {
      if (enhanceAllText) {
        vsRange = new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, lineText.length))
      }
      else {
        const start = new vscode.Position(line, match.index)
        const end = new vscode.Position(line, match.index + match[1].length)

        vsRange = new vscode.Range(start, end)

      }

      decorationsRange.push({ range: vsRange })
    }
  }

  editor.setDecorations(decorationType, decorationsRange)
}
