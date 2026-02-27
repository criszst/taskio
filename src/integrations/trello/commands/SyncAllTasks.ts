import { ProgressLocation, window } from "vscode";

import { TaskioDependencies } from "../../../types/TaskioDependencies";
import { ProcessIndividualSync } from "../SyncUtils";

export default async function SendALLTasks(deps: TaskioDependencies) {
  const allComments = deps.store.getAll().filter(c => c.syncStatus !== 'synced');
    
    if (allComments.length === 0) {
        return window.showInformationMessage("No new tasks to sync.");
    }

    const confirm = await window.showInformationMessage(
        `Do you want to send all ${allComments.length} tasks to Trello?`,
        "Yes, sync all", "Cancel"
    );

    if (confirm !== "Yes, sync all") return;

    await window.withProgress({
      
        location: ProgressLocation.Notification,
        title: "Syncing all tasks...",
        cancellable: false

    }, async (progress) => {
        for (let i = 0; i < allComments.length; i++) {

            await ProcessIndividualSync(allComments[i], deps);
            progress.report({ increment: (100 / allComments.length) });
        }
    });

    window.showInformationMessage(`Successfully synced ${allComments.length} tasks!`);
    deps.treeProvider.refresh();
}
