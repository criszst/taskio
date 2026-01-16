import * as vscode from 'vscode';
import { applyTaskioDecorations } from './decoration/taskioDecoration';

export function activate(context: vscode.ExtensionContext) {
  console.log('🔥 Taskio activated');


  const update = () => {
    const editor = vscode.window.activeTextEditor;

    if (editor) applyTaskioDecorations(editor)
  };

  update();

  //#region EVENT LISTENERS SETUP TODO DECORATIONS

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(update),

    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor
      if (editor && event.document === editor.document) {
        applyTaskioDecorations(editor)
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(update)
  );

  //#endregion


}


export function deactivate() { }
