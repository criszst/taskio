import * as vscode from 'vscode';
import { applyTaskioDecorations } from './decoration/taskioDecoration';
import { TreeProvider } from './treeView/TreeProvider';
import TaskioComment from './types/TaskioComment';
import { CommentStore } from './store/CommentStore';
import ScanDocument from './treeView/scanner/CommentScanner';
import CopyComment from './commands/CopyComment';
import { RevealComment } from './commands/RevealComment';
import { SearchTodos } from './commands/SearchTodos';

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


  // #region TREE VIEW SETUP


  const store = new CommentStore()
  const treeProvider = new TreeProvider(store)

  vscode.window.registerTreeDataProvider(
    'taskioView',
    treeProvider
  );

  if (vscode.window.activeTextEditor) {
    const doc = vscode.window.activeTextEditor.document

    store.setMany(ScanDocument(doc))
    treeProvider.refresh()
  }

  context.subscriptions.push(vscode.commands.registerCommand('taskio.revealComment',
    async (comment: TaskioComment) => {
      if (!comment) return vscode.window.showWarningMessage('Taaskio: No comment selected.');
      await RevealComment(comment);
    }
  )
  );


  context.subscriptions.push(vscode.commands.registerCommand('taskio.copyComment',
    async (comment: TaskioComment) => {
      if (!comment) return;
      await CopyComment(comment);
    }
  )
);


  context.subscriptions.push(vscode.commands.registerCommand('taskio.searchTodos', () => SearchTodos(store)));


  vscode.workspace.onDidOpenTextDocument(document => {
    store.setMany(ScanDocument(document));
    treeProvider.refresh();
  });

  vscode.workspace.onDidChangeTextDocument(event => {
    store.removeByUri(event.document.uri);
    store.setMany(ScanDocument(event.document));
    treeProvider.refresh();
  });


  // #endregion


}


export function deactivate() { }
