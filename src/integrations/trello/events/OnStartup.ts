import { workspace } from "vscode";

import { TaskioDependencies } from "../../../types/TaskioDependencies";

import { syncCardsPatchOnlyOnSave } from "../services/TimerToSync";
import { TrelloService } from "../services/TrelloService";

export async function syncOnStartup(deps: TaskioDependencies): Promise<void> {
  const syncOnStartup = workspace.getConfiguration('taskio.trello').get<boolean>('syncOnStartup');

  if (!syncOnStartup) return;

  const creds = await deps.secretStore.getTrelloCredentials();

  if (!creds) return;

  const tasks = deps.store.getAll();

  if (tasks.length === 0) return;

  const syncedTasks = tasks.filter(t => t.syncStatus === "synced" && t.trelloCardId);
  if (syncedTasks.length === 0) return;

  const trello = new TrelloService(deps.secretStore);
  await syncCardsPatchOnlyOnSave(syncedTasks, deps, trello);
  
  await deps.context.workspaceState.update("taskio.comments", deps.store.getAll());

  deps.treeProvider.refresh();
}
