import { ProgressLocation, window } from 'vscode';
import TaskioComment from '../../../types/TaskioComment';
import { TaskioDependencies } from '../../../types/TaskioDependencies';
import { TrelloService } from './TrelloService';

export default class SyncService {
  constructor(private trello: TrelloService) { }


  async processTasks(input: TaskioComment | TaskioComment[], deps: TaskioDependencies, mode: 'sync' | 'desync'): Promise<void> {
    const comments = Array.isArray(input) ? input : [input];

    if (comments.length === 0)
      return void window.showInformationMessage("No tasks to process.");

    if (mode === 'sync' && comments.every(c => c.syncStatus === 'synced'))
      return void window.showWarningMessage("All tasks are already synced.");

    if (mode === 'desync' && comments.every(c => c.syncStatus === 'local'))
      return void window.showWarningMessage("No tasks are currently synced.");


    const confirmed = await window.showWarningMessage(
      `Are you sure you want to ${mode} ${comments.length} task(s) to Trello?`,
      { modal: true }, "Yes", "No"
    );

    if (confirmed !== "Yes") return void window.showInformationMessage("Operation cancelled.");

    const label = mode === 'sync' ? "Syncing tasks" : "Desyncing tasks";

    await window.withProgress({ location: ProgressLocation.Notification, title: label, cancellable: false },
      async (progress) => {
        const step = 100 / comments.length;

        for (const comment of comments) {
          try {
            mode === 'sync' ? await this.syncOne(comment, deps) : await this.desyncOne(comment, deps);
          } catch (error) {
            console.error(`[Taskio] Failed to process "${comment.text}":`, error);
            window.showErrorMessage(`Failed to process "${comment.text}". Error: ${error}`);
          }

          progress.report({ increment: step, message: `"${comment.displayText ?? comment.text}"` });
        }
      }
    );
  }


  // for automatic sync on save/startup without showing progress or messages
  async processTasksSilent(comments: TaskioComment[], deps: TaskioDependencies, mode: 'sync' | 'desync'): Promise<void> {

    for (const comment of comments) {
      try {
        mode === 'sync' ? await this.syncOne(comment, deps) : await this.desyncOne(comment, deps);
      } catch (error) {
        console.error(`[Taskio] Failed to auto-${mode} task "${comment.text}":`, error);
      }
    }
  }
  
  private async syncOne(comment: TaskioComment, deps: TaskioDependencies): Promise<void> {
    const listId = deps.context.workspaceState.get<string>("taskio.trello.listId");

    if (!listId) throw new Error("No Trello list configured.");

    const filePath = comment.uri.fsPath.replace(/\\/g, '/');

    const name = comment.displayText ?? comment.text;
    const description = `**File:** \`${filePath}\`\n**Line:** ${comment.line + 1}`;



    if (comment.syncStatus === 'synced' && comment.trelloCardId) {
      await this.trello.updateCard(comment.trelloCardId, { name, description });
      deps.store.update(comment);

      return;
    }

    const card = await this.trello.createCard({ listId, name, description, priority: comment.priority });

    comment.syncStatus = 'synced';
    comment.trelloCardId = card.id;

    deps.store.update(comment);
  }

  private async desyncOne(comment: TaskioComment, deps: TaskioDependencies): Promise<void> {
    if (!comment.trelloCardId) return;

    await this.trello.deleteCard(comment.trelloCardId);

    comment.syncStatus = 'local';
    comment.trelloCardId = undefined;

    deps.store.update(comment);
  }
}