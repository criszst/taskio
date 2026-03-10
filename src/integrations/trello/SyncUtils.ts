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

export async function DesyncAllTasks(commentData: TaskioComment, deps: TaskioDependencies) {
  const { store, context, treeProvider } = deps;
  const trello = new TrelloService(deps.secretStore);

  const cardId = commentData.trelloCardId;

  if (!cardId) {
    console.warn(`Task "${commentData.text}" is marked as synced but has no Trello card ID. Skipping desync.`);
    return;
  }

 for (const cards of store.getAll().filter(c => c.trelloCardId === cardId)) {
    cards.trelloCardId = undefined;
    cards.syncStatus = "local";

    await trello.deleteCard(cardId);
    
  }
  
  store.update(commentData);
  treeProvider.refresh();

  await context.workspaceState.update("taskio.comments", store.getAll());
}