import { workspace } from "vscode";

import { TaskioDependencies } from "../../../types/TaskioDependencies";

import SyncService from "../services/SyncService";
import { TrelloService } from "../services/TrelloService";

export async function syncOnStartup(deps: TaskioDependencies): Promise<void> {
  const syncOnStartup = workspace.getConfiguration('taskio.trello').get<boolean>('syncOnStartup');

  if (!syncOnStartup) return;

  const creds = await deps.secretStore.getTrelloCredentials();

  if (!creds) return;

  const tasks = deps.store.getAll();

  if (tasks.length === 0) return;

  const syncService = new SyncService(new TrelloService(deps.secretStore));
  await syncService.processTasksSilent(tasks, deps, 'sync');
  
  await deps.context.workspaceState.update("taskio.comments", deps.store.getAll());

  deps.treeProvider.refresh();
}