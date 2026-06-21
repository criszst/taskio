import { window } from "vscode";
import { TaskioDependencies } from "../../../../types/TaskioDependencies";
import { clearAllTrelloAutoSyncTimers, clearTrelloSyncCache } from "../../services/TimerToSync";

export default async function DisconnectTrello(deps: TaskioDependencies): Promise<void> {
  const {context} = deps;
  
  const confirm = await window.showWarningMessage(
        "Are you sure you want to disconnect Trello?", 
        { modal: true }, 
        "Yes",
        "No"
    );
    if (confirm === "Yes") {
        await deps.secretStore.removeTrelloCredentials();
        await context.workspaceState.update("taskio.trello.listId", undefined);
        await context.workspaceState.update("taskio.trello.boardId", undefined);
        await context.workspaceState.update("taskio.trello.boardName", undefined);
        await context.workspaceState.update("taskio.trello.listName", undefined);
        await context.workspaceState.update("taskio.trello.syncOnStartup", undefined);
        clearAllTrelloAutoSyncTimers();
        await clearTrelloSyncCache(deps);

        for (const comment of deps.store.getAll()) {
            comment.syncStatus = "local";
            comment.trelloCardId = undefined;
        }

        await context.workspaceState.update("taskio.comments", deps.store.getAll());

        window.showInformationMessage("Trello disconnected.");
    }

    return;
}
