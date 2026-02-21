import { Comment, ProgressLocation, window, workspace } from "vscode";

import TaskioComment from "../../../types/TaskioComment";
import { TaskioDependencies } from "../../../types/TaskioDependencies";

import { TrelloService } from "../TrelloService";

import { CommentNode } from "../../../treeView/TreeNode";

import TrelloCard from "../types/Card";
import { ApplyDecorators } from "../../../decoration/ApplyDecorators";


export default async function SendTask(comment: CommentNode, deps: TaskioDependencies) {
  const { store, treeProvider, secretStore, context } = deps;

  const commentData: TaskioComment = comment.comment;

  if (!commentData) return window.showWarningMessage('Taskio: No comment selected.');

  if (commentData.syncStatus === 'synced') return window.showInformationMessage('This task is already synced with Trello.');

  if (!secretStore) return window.showErrorMessage('Trello integration not set up. Please run "Setup Trello Integration" command first.');
  

  try {
    const config = workspace.getConfiguration();
    const listId = config.get<string>("taskio.trello.listId");

    if (!listId) {
      window.showErrorMessage("No Trello list configured. Please run the 'Setup Trello Integration' command first.");
      return;
    }

    const trello = new TrelloService(secretStore);

    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Sending task to Trello...",
      },
      async () => {

         const filePath = commentData.uri.fsPath.replace(/\\/g, '/');
        const line = commentData.line + 1;
        const char = commentData.character + 1;

        const vscodeLink = `vscode://file/${encodeURI(filePath)}:${line}:${char}`

        const description = `
        **File:** \`${filePath}\`
        **Position:** Line ${line}, Column ${char}
         [Open in VS Code](${vscodeLink})`.trim();

        const card = await trello.createCard(
          {
            listId,
            name: commentData.displayText ?? commentData.text,
            description,
            priority: commentData.priority,
          }
        );



        commentData.trelloCardId = card.id;
        commentData.syncStatus = "synced";

        store.update(commentData);

        await context.workspaceState.update("taskio.comments", store.getAll());
      }
    );

    treeProvider.refresh();

    window.showInformationMessage("Task sent to Trello ✅");

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