import { ProgressLocation, window } from "vscode";

import TaskioComment from "../../../types/TaskioComment";
import { TaskioDependencies } from "../../../types/TaskioDependencies";

import { CommentNode } from "../../../treeView/TreeNode";
import SyncService from "../services/SyncService";
import { TrelloService } from "../services/TrelloService";

export default async function SendTask(comment: CommentNode, deps: TaskioDependencies) {
  const { store, treeProvider, secretStore, context } = deps;

  const syncService = new SyncService(new TrelloService(secretStore));

  const commentData: TaskioComment = comment.comment;

  if (!commentData) return window.showWarningMessage("Taskio: No comment selected.");

  if (commentData.syncStatus === "synced") {
    return window.showInformationMessage("This task is already synced with Trello.");
  }

  if (!secretStore) {
    return window.showErrorMessage('Trello integration not set up. Please run "Setup Trello Integration" command first.');
  }

  try {
    if (!hasConfiguredList(context)) {
      window.showErrorMessage("No Trello list configured. Please run the 'Setup Trello Integration' command first.");
      return;
    }

    const syncResult = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: `Syncing ${commentData.text} to Trello...`,
      },
      async () => syncService.processTasks(commentData, deps, "sync")
    );

    const hasPartialFailure = syncResult.failureCount > 0;

    if (hasPartialFailure) {
      markTaskAsFailed(commentData, store);
    }

    await persistComments(context, store);

    treeProvider.refresh();

    if (hasPartialFailure) {
      window.showErrorMessage("Failed to send task to Trello");
      return;
    }

    window.showInformationMessage("Task sent to Trello!");
  } catch {
    markTaskAsFailed(commentData, store);
    await persistComments(context, store);
    treeProvider.refresh();
    window.showErrorMessage("Failed to send task to Trello");
  }
}

function hasConfiguredList(context: TaskioDependencies["context"]): boolean {
  return Boolean(context.workspaceState.get<string>("taskio.trello.listId"));
}

function markTaskAsFailed(commentData: TaskioComment, store: TaskioDependencies["store"]): void {
  commentData.syncStatus = "error";
  store.update(commentData);
}

async function persistComments(
  context: TaskioDependencies["context"],
  store: TaskioDependencies["store"],
): Promise<void> {
  await context.workspaceState.update("taskio.comments", store.getAll());
}
