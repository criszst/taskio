import * as vscode from 'vscode';
import { CommentStore } from '../store/CommentStore';
import { getTaskioConfig } from '../config/GetConfig';
import shouldIgnoreDocument from '../config/IgnoredFiles';

function createDecorationTypes() {
  const { color } = getTaskioConfig();

  return {
    default: vscode.window.createTextEditorDecorationType({
      fontWeight: 'bold',
      backgroundColor: color,
      color: '#f7f0f0b7',
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
      backgroundColor: '#8be9fd44',
      color: '#8be9fd',
    }),
  };
}

let currentDecorations = createDecorationTypes();

export function ApplyDecorators( editor: vscode.TextEditor, store: CommentStore): void {
  const document = editor.document;
  const uri = document.uri;

  const byPriority = {
    high: [] as vscode.DecorationOptions[],
    medium: [] as vscode.DecorationOptions[],
    low: [] as vscode.DecorationOptions[],
    default: [] as vscode.DecorationOptions[],
  };

  if (!shouldIgnoreDocument(uri)) {
    const { enhanceAllText } = getTaskioConfig();
    const comments = store.getByUri(uri);

    for (const comment of comments) {
      if (comment.line < 0 || comment.line >= document.lineCount) {
        continue;
      }

      const line = document.lineAt(comment.line);
      const start = comment.character;

      if (start < 0 || start > line.text.length) {
        continue;
      }

      const end = enhanceAllText ? line.text.length : Math.min(start + comment.keyword.length, line.text.length);

      if (end <= start) {
        continue;
      }

      const range = new vscode.Range(comment.line, start, comment.line, end);

      const priority: keyof typeof byPriority =
          comment.priority === 'high' ||
          comment.priority === 'medium' ||
          comment.priority === 'low'
          ? comment.priority
          : 'default';

      byPriority[priority].push({ range });
    }
  }

  editor.setDecorations(
    currentDecorations.high,
    byPriority.high
  );

  editor.setDecorations(
    currentDecorations.medium,
    byPriority.medium
  );

  editor.setDecorations(
    currentDecorations.low,
    byPriority.low
  );

  editor.setDecorations(
    currentDecorations.default,
    byPriority.default
  );
}

export function refreshDecorationTypes(
  store: CommentStore
): void {
  Object.values(currentDecorations).forEach(
    decoration => decoration.dispose()
  );

  currentDecorations = createDecorationTypes();

  for (const editor of vscode.window.visibleTextEditors) {
    ApplyDecorators(editor, store);
  }
}