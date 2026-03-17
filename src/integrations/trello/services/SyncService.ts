import { ProgressLocation, window, Progress } from 'vscode';
import TaskioComment from '../../../types/TaskioComment';
import { TaskioDependencies } from '../../../types/TaskioDependencies';
import { TrelloService } from './TrelloService';

export default class SyncService {
  private trello: TrelloService;

  constructor(trello: TrelloService) {
    this.trello = trello;
  }


  async processTasks(input: TaskioComment | TaskioComment[], deps: TaskioDependencies, mode: 'sync' | 'desync'): Promise<void> {
    const comments = Array.isArray(input) ? input : [input];

    if (comments.length === 0) {
      window.showInformationMessage("No tasks to process.");
      return;
    }

    if (comments.every(c => c.syncStatus === 'synced') && mode === 'sync') {
      window.showWarningMessage("All tasks are already synced.");
      return;
    }

    if (comments.every(c => c.syncStatus === 'local') && mode === 'desync') {
      window.showWarningMessage("No tasks are currently synced.");
      return;
    }

    const title = mode === 'sync' ? "Syncing tasks" : "Desyncing tasks";

    const confirmation = await window.showWarningMessage(
        `Are you sure you want to ${mode} ${comments.length} tasks to Trello?`,
        { modal: true },
        "Yes",
        "No"
      );

    if (confirmation !== "Yes") {
      window.showInformationMessage("Operation cancelled.");
      return;
    }

    await window.withProgress({
      location: ProgressLocation.Notification,
      title,
      cancellable: false,
    }, async (progress) => {

      const incrementUnit = 100 / comments.length;

      for (const comment of comments) {
        try {
          if (mode === 'sync') {
             await this.syncOne(comment, deps);
          } else {
            await this.desyncOne(comment, deps);
          }
        } catch (error) {
          console.error(`Failed to process task ${comment.text}:`, error);
          window.showErrorMessage(`Failed to process task "${comment.text}". Please try again.\n Error: ${error}`);
        } finally {
          progress.report({ increment: incrementUnit, message: `"${comment.displayText}"` });
        }
      }
    });
  }

  private async syncOne(comment: TaskioComment, deps: TaskioDependencies): Promise<void> {
    const listId = deps.context.workspaceState.get<string>("taskio.trello.listId");
    if (!listId) throw new Error("No Trello list configured.");

    const filePath = comment.uri.fsPath.replace(/\\/g, '/');
    const description = `**File:** \`${filePath}\`\n**Position:** Line ${comment.line + 1}`;

    const card = await this.trello.createCard({
      listId,
      name: comment.displayText ?? comment.text,
      description,
      priority: comment.priority,
    });

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