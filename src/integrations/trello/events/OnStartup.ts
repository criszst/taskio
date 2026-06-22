import { workspace } from "vscode";

import { TaskioDependencies } from "../../../types/TaskioDependencies";

import { reconcileTrelloTasks } from "../services/TimerToSync";
import { TrelloService } from "../services/TrelloService";

export async function syncOnStartup(deps: TaskioDependencies): Promise<void> {
  const syncOnStartup = workspace.getConfiguration('taskio.trello').get<boolean>('syncOnStartup');

  if (!syncOnStartup) return;

  const creds = await deps.secretStore.getTrelloCredentials();

  const listId = deps.context.workspaceState.get<string>("taskio.trello.listId");

  if (!creds || !listId) return;

  const tasks = deps.store.getAll();

  if (tasks.length === 0) return;

  const trello = new TrelloService(deps.secretStore);
  await reconcileTrelloTasks(tasks, deps, trello, "startup");
  
  await deps.context.workspaceState.update("taskio.comments", deps.store.getAll());

  deps.treeProvider.refresh();
}
