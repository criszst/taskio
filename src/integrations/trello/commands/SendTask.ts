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

  if (!commentData) return window.showWarningMessage('Taskio: No comment selected.');

  if (commentData.syncStatus === 'synced') return window.showInformationMessage('This task is already synced with Trello.');

  if (!secretStore) return window.showErrorMessage('Trello integration not set up. Please run "Setup Trello Integration" command first.');
  

  try {
    const listId = context.workspaceState.get<string>("taskio.trello.listId");

    if (!listId) {
      window.showErrorMessage("No Trello list configured. Please run the 'Setup Trello Integration' command first.");
      return;
    }

   await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: `Syncing ${commentData.text} to Trello...`,
      },
      async () => {
        await syncService.processTasks(commentData, deps, 'sync');
      }
    );

    treeProvider.refresh();

    window.showInformationMessage("Task sent to Trello!");

  } catch (error) {

    commentData.syncStatus = "error";
    store.update(commentData);

    await context.workspaceState.update(
      "taskio.comments",
      store.getAll()
    );

    treeProvider.refresh();

    window.showErrorMessage("Failed to send task to Trello ❌");
  }
}