import * as vscode from 'vscode';

import TaskioComment from './types/TaskioComment';

import EventManager from './events/EventManager';
import createDeps from './events/CreateDeps';

import { registerDocumentHandler } from './events/handlers/documentHandler';
import { registerWorkspaceHandler, verifyWorkspaceChanges } from './events/handlers/workspaceHandler';
import { registerEditorHandler } from './events/handlers/editorHandler';

import { registerCommands } from './events/RegisterCommands';

import { syncOnStartup } from './integrations/trello/events/OnStartup';
import { registerTrelloUriHandler } from './integrations/trello/services/TrelloAuthUri';


export async function activate(context: vscode.ExtensionContext) {
  const deps = createDeps(context);
  context.subscriptions.push(registerTrelloUriHandler());

  const savedComments = context.workspaceState.get<TaskioComment[]>("taskio.comments", []);
  const syncCache = new Map<string, TaskioComment>();

  savedComments.forEach(c => {
    if (c.syncStatus === "synced") {
      const uriStr = vscode.Uri.parse((c.uri as any).external || c.uri.toString()).toString();

      syncCache.set(`${uriStr}|${c.text}`, c);
    }
  });

  await verifyWorkspaceChanges(deps, syncCache);
  await syncOnStartup(deps);

  const eventManager = new EventManager();

  registerEditorHandler(eventManager, deps);

  registerDocumentHandler(eventManager, deps);
  registerWorkspaceHandler(eventManager, deps);

  registerCommands(context, deps);


  context.subscriptions.push(eventManager);

}


export function deactivate() { }
