import * as vscode from 'vscode';

import EventManager from './events/EventManager';
import createDeps from './events/CreateDeps';

import { registerDocumentHandler } from './events/handlers/documentHandler';
import { registerWorkspaceHandler, verifyWorkspaceChanges } from './events/handlers/workspaceHandler';
import { registerEditorHandler } from './events/handlers/editorHandler';

import { registerCommands } from './events/RegisterCommands';
import SecretStore from './integrations/trello/SecretStorage';
import TaskioComment from './types/TaskioComment';


export async function activate(context: vscode.ExtensionContext) {
  const deps = createDeps(context);

  const savedComments = context.workspaceState.get<TaskioComment[]>("taskio.comments", []);
  
  if (savedComments.length > 0) {
    const recoveredComments = savedComments.map(c => ({
      ...c,
      uri: vscode.Uri.parse((c.uri as any).external || c.uri.toString())
    }));

    deps.store.setMany(recoveredComments);
  }

  const eventManager = new EventManager();
  await verifyWorkspaceChanges(deps);
  
  registerEditorHandler(eventManager, deps);

  registerDocumentHandler(eventManager, deps);
  registerWorkspaceHandler(eventManager, deps);

  registerCommands(context, deps);


  context.subscriptions.push(eventManager);

}


export function deactivate() { }
