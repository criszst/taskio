import { env, Uri, window } from "vscode";

import { TaskioDependencies } from "../../../../types/TaskioDependencies";
import { setupTrello } from "../configs/SetupTrello";
import { TrelloService } from "../../services/TrelloService";

import SelectBoardList from "../manager/SelectBoardList";
import DisconnectTrello from "./DisconnectTrello";

import { QuickPickItemKind } from "vscode";


import SyncService from "../../services/SyncService";
import SelectSyncMode from "../manager/SyncSettings";
import SyncSettings from "../manager/SyncSettings";

export default async function ManageIntegration(deps: TaskioDependencies): Promise<void> {
  const creds = await deps.secretStore.getTrelloCredentials();
  const listId = deps.context.workspaceState.get("taskio.trello.listId");

  const syncService = new SyncService(new TrelloService(deps.secretStore));


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
    { label: "Configuration", kind: QuickPickItemKind.Separator },

    {
      label: "$(gear) Change Board or List",
      description: `${boardName} › ${listName}`,
      detail: "Switch which Trello board or list receives your tasks",
      action: 'change'
    },
    {
      label: "$(settings) Sync Settings",
      description: "Auto-sync, startup sync",
      detail: "Customize when and how tasks are sent to Trello",
      action: 'configure_sync'
    },


    { label: "Sync", kind: QuickPickItemKind.Separator},

    {
      label: "$(sync) Sync All Tasks",
      detail: "Send all unsynced tasks to Trello now",
      action: 'sync_all'
    },
    {
      label: "$(trash) Desync All Tasks",
      detail: "Remove all tasks from Trello — they stay in VS Code",
      action: 'desync_all'
    },
    

    { label: "More", kind: QuickPickItemKind.Separator},

    {
      label: "$(browser) Open Board in Browser",
      action: 'open_trello'
    },
    {
      label: "$(plug) Disconnect Trello",
      detail: "Remove API keys and reset workspace settings",
      action: 'disconnect'
    }

  ], {
    placeHolder: "Manage Trello Integration",
    matchOnDescription: true,
    matchOnDetail: true
  });

  if (!pick) return;

  switch (pick.action) {
    // CONFIG ACTIONS
    case 'change':
      const trello = new TrelloService(deps.secretStore);
      await SelectBoardList(trello, deps.context);
      break;

    case 'configure_sync':
      await SyncSettings(deps);
      break;


    // SYNC ACTIONS
    case 'sync_all':
      await syncService.processTasks(deps.store.getAll(), deps, 'sync');
      break;

    case 'desync_all':
      await syncService.processTasks(deps.store.getAll(), deps, 'desync');
      break;


    // UTILITIES ACTIONS

    case 'open_trello':
      env.openExternal(Uri.parse(`https://trello.com/b/${boardId}/${boardName}`));
      break;

    case 'disconnect':
      await DisconnectTrello(deps);
      break;
  }
}