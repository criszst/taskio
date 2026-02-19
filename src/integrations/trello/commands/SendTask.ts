import { ProgressLocation, window, workspace } from "vscode";

import * as vscode from "vscode";
import TaskioComment from "../../../types/TaskioComment";
import { TrelloService } from "../TrelloService";
import SecretStore from "../SecretStorage";

import { CommentStore } from "../../../store/CommentStore";

import createDeps from "../../../events/CreateDeps";
import { TaskioDependencies } from "../../../types/TaskioDependencies";

export default async function SendTask(comment: TaskioComment, deps: TaskioDependencies) {
  const { store, treeProvider, secretStore, context } = deps;

  if (!comment) return window.showWarningMessage('Taskio: No comment selected.');

  if (comment.syncStatus === 'synced') {
    return window.showInformationMessage('This task is already synced with Trello.');
  }

  if (!secretStore) {
    return window.showErrorMessage('Trello integration not set up. Please run "Setup Trello Integration" command first.');
  }

  try {
    const config = workspace.getConfiguration();
    const listId = config.get<string>("taskio.trello.listId");

    if (!listId) {
      window.showErrorMessage("No Trello list configured.");
      return;
    }

    const trello = new TrelloService(secretStore);

    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Sending task to Trello...",
      },
      async () => {
        const card: any = await trello.createCard(
          listId,
          comment.displayText ?? comment.text
        );


        comment.trelloCardId = card.id;
        comment.syncStatus = "synced";

        store.update(comment);

        await context.workspaceState.update(
          "taskio.comments",
          store.getAll()
        );
      }
    );

    treeProvider.refresh();

    window.showInformationMessage("Task sent to Trello ✅");

  } catch (error) {

    comment.syncStatus = "error";
    store.update(comment);

    await context.workspaceState.update(
      "taskio.comments",
      store.getAll()
    );

    treeProvider.refresh();

    window.showErrorMessage("Failed to send task to Trello ❌");
  }
}