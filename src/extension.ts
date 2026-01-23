import * as vscode from 'vscode';
import { ApplyDecorators } from './decoration/ApplyDecorators';
import { TreeProvider } from './treeView/TreeProvider';
import TaskioComment from './types/TaskioComment';
import { CommentStore } from './store/CommentStore';
import ScanDocument from './treeView/scanner/DocumentScanner';
import CopyComment from './commands/CopyComment';
import { RevealComment } from './commands/RevealComment';
import { SearchTodos } from './commands/SearchTodos';
import { ScanWorkspace } from './treeView/scanner/WorkspaceScanner';

export function activate(context: vscode.ExtensionContext) {
  console.log('🔥 Taskio activated');

  const store = new CommentStore()
  const treeProvider = new TreeProvider(store);


  const update = () => {
    const editor = vscode.window.activeTextEditor;

    if (editor) ApplyDecorators(editor, store)
  };

  update();

  //#region EVENT LISTENERS SETUP TODO DECORATIONS

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(update),

    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor
      if (editor && event.document === editor.document) {
        ApplyDecorators(editor, store)
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(update)
  );

  //#endregion



  // #region TREE VIEW SETUP


  // ...
  (async () => {
    if (vscode.workspace.workspaceFolders) {
      await ScanWorkspace(store);
      treeProvider.refresh();
    }
  })();

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
      await RevealComment(comment);
    }
  ));


  context.subscriptions.push(vscode.commands.registerCommand('taskio.copyComment',
    async (comment: TaskioComment) => {
      await CopyComment(comment);
    }
  ));


  context.subscriptions.push(vscode.commands.registerCommand('taskio.searchTodos', () => SearchTodos(store)));


  vscode.workspace.onDidOpenTextDocument(document => {
    store.setMany(ScanDocument(document));
    treeProvider.refresh();
  });

  vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.activeTextEditor;
    const doc = event.document;


    store.removeByUri(doc.uri);
    store.setMany(ScanDocument(doc));


    treeProvider.refresh();

    if (editor && editor.document === doc) {
      ApplyDecorators(editor, store);

    }
  });



  // #endregion


}


export function deactivate() { }