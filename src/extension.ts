import * as vscode from 'vscode';

import EventManager from './events/EventManager';
import createDeps from './events/CreateDeps';

import { registerDocumentHandler } from './events/handlers/documentHandler';
import { registerWorkspaceHandler, verifyWorkspaceChanges } from './events/handlers/workspaceHandler';
import { registerEditorHandler } from './events/handlers/editorHandler';

import { registerCommands } from './events/RegisterCommands';


export async function activate(context: vscode.ExtensionContext) {
  const deps = createDeps();
  const eventManager = new EventManager();

  await verifyWorkspaceChanges(deps);

  registerEditorHandler(eventManager, deps);

  registerDocumentHandler(eventManager, deps);
  registerWorkspaceHandler(eventManager, deps);

  registerCommands(context, deps);

  
  context.subscriptions.push(eventManager);

}


export function deactivate() { }
