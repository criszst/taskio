import { window } from 'vscode';
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

export async function DesyncIndividualTask(commentData: TaskioComment, deps: TaskioDependencies) {
  const { store, context } = deps;

  commentData.trelloCardId = undefined;
  commentData.syncStatus = "local";
  
  store.update(commentData);
  await context.workspaceState.update("taskio.comments", store.getAll());
}