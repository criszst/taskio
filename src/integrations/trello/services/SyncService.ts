import { ProgressLocation, window } from 'vscode';
import TaskioComment from '../../../types/TaskioComment';
import { TaskioDependencies } from '../../../types/TaskioDependencies';
import { TrelloService } from './TrelloService';
import { reconcileTrelloTasks } from './TimerToSync';

export type SyncBatchResult = {
  successCount: number;
  failureCount: number;
};

export default class SyncService {
  constructor(private trello: TrelloService) { }


  async processTasks(input: TaskioComment | TaskioComment[], deps: TaskioDependencies, mode: 'sync' | 'desync'): Promise<SyncBatchResult> {
    const comments = Array.isArray(input) ? input : [input];

    if (comments.length === 0) {
      await window.showInformationMessage("No tasks to process.");
      return { successCount: 0, failureCount: 0 };
    }

    if (mode === 'sync' && comments.every(c => Boolean(c.syncStatus === 'synced' && c.trelloCardId))) {
      await window.showWarningMessage("All tasks are already synced.");
      return { successCount: 0, failureCount: 0 };
    }

    if (mode === 'desync' && comments.every(c => !c.trelloCardId)) {
      await window.showWarningMessage("No tasks are currently synced.");
      return { successCount: 0, failureCount: 0 };
    }


    const confirmed = await window.showWarningMessage(
      `Are you sure you want to ${mode} ${comments.length} task(s) to Trello?`,
      { modal: true }, "Yes", "No"
    );

    if (confirmed !== "Yes") {
      await window.showInformationMessage("Operation cancelled.");
      return { successCount: 0, failureCount: 0 };
    }

    const label = mode === 'sync' ? "Syncing tasks" : "Desyncing tasks";

    const result = await window.withProgress({ location: ProgressLocation.Notification, title: label, cancellable: false },
      async (progress) => {
        const step = 100 / comments.length;
        let successCount = 0;
        let failureCount = 0;

        for (const comment of comments) {
          try {
            if (mode === 'sync') {
              const syncResult = await reconcileTrelloTasks([comment], deps, this.trello, "manual");
              successCount += syncResult.successCount + syncResult.skippedCount;
              failureCount += syncResult.failureCount;
            } else {
              await this.desyncOne(comment, deps);
              successCount += 1;
            }
          } catch (error) {
            failureCount += 1;
            console.error(`[Taskio] Failed to process "${comment.text}":`, error);
            window.showErrorMessage(`Failed to process "${comment.text}". Error: ${error}`);
          }

          progress.report({ increment: step, message: `"${comment.displayText ?? comment.text}"` });
        }

        return { successCount, failureCount };
      }
    );

    return result ?? { successCount: 0, failureCount: 0 };
  }


  // for automatic sync on save/startup without showing progress or messages
  async processTasksSilent(comments: TaskioComment[], deps: TaskioDependencies, mode: 'sync' | 'desync'): Promise<void> {

    for (const comment of comments) {
      try {
        if (mode === 'sync') {
          await reconcileTrelloTasks([comment], deps, this.trello, "manual");
        } else {
          await this.desyncOne(comment, deps);
        }
      } catch (error) {
        console.error(`[Taskio] Failed to auto-${mode} task "${comment.text}":`, error);
      }
    }
  }

  private async desyncOne(comment: TaskioComment, deps: TaskioDependencies): Promise<void> {
    if (!comment.trelloCardId) return;

    await this.trello.deleteCard(comment.trelloCardId);

    comment.syncStatus = 'never_synced';
    comment.trelloCardId = undefined;
    comment.lastSyncedText = undefined;
    comment.lastSyncedMetadataHash = undefined;
    comment.lastError = undefined;

    deps.store.update(comment);
  }
}
