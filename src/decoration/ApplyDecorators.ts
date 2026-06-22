import * as vscode from 'vscode'
import { CommentStore } from '../store/CommentStore'
import { getTaskioConfig } from '../config/GetConfig'
import shouldIgnoreDocument from '../config/IgnoredFiles';

let currentDecorations = {
  default: vscode.window.createTextEditorDecorationType({
    backgroundColor: `${getTaskioConfig().color}`,
    color: `${getTaskioConfig().color}`,
    fontWeight: 'bold',
  }),

  high: vscode.window.createTextEditorDecorationType({
    backgroundColor: '#ff555544',
    color: '#ff5555'
  }),
  medium: vscode.window.createTextEditorDecorationType({
    backgroundColor: '#f1fa8c44',
    color: '#f1fa8c'
  }),
  low: vscode.window.createTextEditorDecorationType({
    backgroundColor: '#8be9fd44',
    color: '#8be9fd'
  })
};


function createDecorations() {
  currentDecorations.high.dispose();
  currentDecorations.medium.dispose();
  currentDecorations.low.dispose();

  currentDecorations = {
    default: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      backgroundColor: `${getTaskioConfig().color}`,
      color: `#f7f0f0b7`,
     }),

    high: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      backgroundColor: '#ff555544',
      color: '#ff5555',
    }),
    medium: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      backgroundColor: '#f1fa8c44',
      color: '#9fa74e',
    }),
    low: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      backgroundColor: `#8be9fd44`,
      color: '#8be9fd',
    })
  };
}

createDecorations();

export function ApplyDecorators(editor: vscode.TextEditor, store: CommentStore): void {
  const uri = editor.document.uri;

  if (shouldIgnoreDocument(uri)) return;


  const { enhanceAllText } = getTaskioConfig();

  const byPriority = {
    high: [] as vscode.DecorationOptions[],
    medium: [] as vscode.DecorationOptions[],
    low: [] as vscode.DecorationOptions[],
    default: [] as vscode.DecorationOptions[],
  };

  const comments = store.getByUri(uri);

  for (const comment of comments) {
    let range: vscode.Range;

    if (enhanceAllText) {
      const lineEnd = editor.document.lineAt(comment.line).range.end.character;

      range = new vscode.Range(
        new vscode.Position(comment.line, comment.character),
        new vscode.Position(
          comment.line,
          Math.max(comment.character, lineEnd)
        )
      );
    } else {

      const keywordLength = comment.keyword.length;
      range = new vscode.Range(
        new vscode.Position(comment.line, comment.character),
        new vscode.Position(
          comment.line,
          comment.character + keywordLength
        )
      );
    }
    
    const priority: keyof typeof byPriority =
      comment.priority === 'high' ||
      comment.priority === 'medium' ||
      comment.priority === 'low' ? comment.priority : 'default';

    byPriority[priority].push({ range });
  }

  editor.setDecorations(currentDecorations.high, byPriority.high);
  editor.setDecorations(currentDecorations.medium, byPriority.medium);
  editor.setDecorations(currentDecorations.low, byPriority.low);
  editor.setDecorations(currentDecorations.default, byPriority.default);
}

export function refreshDecorationTypes(): void {
  createDecorations();
}
