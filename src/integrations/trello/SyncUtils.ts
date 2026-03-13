import { ProgressLocation, window } from 'vscode';

import TaskioComment from '../../types/TaskioComment';
import { TaskioDependencies } from '../../types/TaskioDependencies';
import { TrelloService } from './TrelloService';

export async function ProcessIndividualSync(commentData: TaskioComment, deps: TaskioDependencies): Promise<void> {
  const { store, secretStore, context } = deps;


  const listId = context.workspaceState.get<string>("taskio.trello.listId");

  if (!listId) throw new Error("No Trello list configured.");

  const trello = new TrelloService(secretStore);

  const filePath = commentData.uri.fsPath.replace(/\\/g, '/');
  const line = commentData.line + 1;
  const char = commentData.character + 1;


  const description = `
**File:** \`${filePath}\`
**Position:** Line ${line}, Column ${char}`


  const card = await trello.createCard({
    listId,
    name: commentData.displayText ?? commentData.text,
    description,
    priority: commentData.priority,
  });


  commentData.trelloCardId = card.id;
  commentData.syncStatus = "synced";

  store.update(commentData);
  await context.workspaceState.update("taskio.comments", store.getAll());
}

export async function DesyncAllTasks(deps: TaskioDependencies) {
  const { store, context, treeProvider } = deps;

  const trello = new TrelloService(deps.secretStore);


  const allCommentsSynced = deps.store.getAll().filter(comment => comment.syncStatus === "synced");

  if (allCommentsSynced.length === 0) return window.showInformationMessage("No tasks to desync.");


  const confirmation = await window.showWarningMessage(
    `Are you sure you want to desync all ${allCommentsSynced.length} tasks from Trello?`,
    { modal: true },
    "Yes",
    "No"
  )

  if (confirmation !== "Yes") return;

  await window.withProgress({
    location: ProgressLocation.Notification,
    title: "Desyncing all tasks...",
    cancellable: false
  }, async (progress) => {

    for (const comment of allCommentsSynced) {
      if (!comment.trelloCardId) {
        console.warn(`Task "${comment.text}" is marked as synced but has no Trello card ID. Skipping desync.`);
        continue;
      }

      await trello.deleteCard(comment.trelloCardId);
      comment.trelloCardId = undefined;
      comment.syncStatus = "local";

      store.update(comment);

      progress.report({ increment: (100 / allCommentsSynced.length) });

    }
  });

  window.showInformationMessage(`Successfully desynced ${allCommentsSynced.length} tasks.`);

  treeProvider.refresh();

  await context.workspaceState.update("taskio.comments", store.getAll());
}