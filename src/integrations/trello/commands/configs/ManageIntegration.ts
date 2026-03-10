import { env, ProgressLocation, Uri, window } from "vscode";

import { TaskioDependencies } from "../../../../types/TaskioDependencies";
import { setupTrello } from "../configs/SetupTrello";
import { TrelloService } from "../../TrelloService";

import SelectBoardList from "../SelectBoardList";
import DisconnectTrello from "./DisconnectTrello";

import SendALLTasks from "../SyncAllTasks";
import { DesyncAllTasks } from "../../SyncUtils";

export default async function ManageIntegration(deps: TaskioDependencies): Promise<void> {
  const creds = await deps.secretStore.getTrelloCredentials();
  const listId = deps.context.workspaceState.get("taskio.trello.listId");


  if (!creds || !listId) {
    const action = await window.showInformationMessage(
      "Trello integration is not fully configured. Would you like to set it up now?",
      "Setup Trello",
      "Cancel"
    );

    if (action === "Setup Trello") {
      await setupTrello(deps.secretStore, deps);
    }
    return;
  }

  const boardName = deps.context.workspaceState.get("taskio.trello.boardName") || "Unknown Board";
  const boardId = deps.context.workspaceState.get("taskio.trello.boardId");

  const listName = deps.context.workspaceState.get("taskio.trello.listName") || "Unknown List";

  const pick = await window.showQuickPick([
    {
      label: "$(gear) Change Board or List",
      description: `Current: ${boardName} > ${listName}`,
      action: 'change'
    },
    {
      label: "$(cloud-upload) Sync All Tasks",
      description: "Send all unsynced tasks in workspace to Trello",
      action: 'sync_all'
    },
    {
      label: "$(browser) Open Current Board in Browser",
      action: 'open_trello'
    },

    {
      label: "$(cloud-download) Desync All Tasks",
      description: "Delete all synced tasks in workspace from Trello",
      action: 'desync_all'
    },
    {
      label: "$(plug) Disconnect Trello",
      description: "Remove API keys and workspace settings",
      action: 'disconnect'
    }
  ], {
    placeHolder: "Trello Integration Management"
  });

  if (!pick) return;

  switch (pick.action) {
    case 'change':
      const trello = new TrelloService(deps.secretStore);
      await SelectBoardList(trello, deps.context);
      break;

    case 'sync_all':
      await SendALLTasks(deps);
      break;

    case 'desync_all':
      const allCommentsSynced = deps.store.getAll().filter(comment => comment.syncStatus === "synced");

      if (allCommentsSynced.length === 0) window.showInformationMessage("No tasks to desync.");
      

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
        DesyncAllTasks(comment, deps);
        progress.report({ increment: (100 / allCommentsSynced.length) });
      }
    });

      window.showInformationMessage(`Successfully desynced ${allCommentsSynced.length} tasks.`);
      deps.treeProvider.refresh();
      break;

    case 'open_trello':
      env.openExternal(Uri.parse(`https://trello.com/b/${boardId}/${boardName}`));
      break;

    case 'disconnect':
      await DisconnectTrello(deps);
      break;
  }
}