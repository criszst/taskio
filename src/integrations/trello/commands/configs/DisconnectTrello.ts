import { window } from "vscode";
import { TaskioDependencies } from "../../../../types/TaskioDependencies";

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

        await context.workspaceState.update("taskio.trello.syncOnSave", undefined);
        await context.workspaceState.update("taskio.trello.syncOnStartup", undefined);

        const allSynced = deps.store.getAll().filter(comment => comment.syncStatus === "synced");

        for (const comment of allSynced) {
            comment.syncStatus = "local";
        }

        window.showInformationMessage("Trello disconnected.");
    }

    return;
}