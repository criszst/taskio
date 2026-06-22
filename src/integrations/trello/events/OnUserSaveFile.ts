import { TextDocument } from "vscode";

import { TaskioDependencies } from "../../../types/TaskioDependencies";

import { clearTrelloAutoSyncTimer, getTrelloAutoSyncSetting, scheduleTrelloAutoSync } from "../services/TimerToSync";
import { TrelloService } from "../services/TrelloService";

export default class OnUserSaveFile {
  private trelloService: TrelloService;

  constructor(private doc: TextDocument, private deps: TaskioDependencies) {
    this.trelloService = new TrelloService(deps.secretStore);
  }

  public async SaveTasks(): Promise<void> {
    const timerToSync = getTrelloAutoSyncSetting();
    const creds = await this.deps.secretStore.getTrelloCredentials();
    const listId = this.deps.context.workspaceState.get<string>("taskio.trello.listId");
    const tasksInFile = this.deps.store.getByUri(this.doc.uri);

    await this.deps.context.workspaceState.update("taskio.comments", this.deps.store.getAll());

    if (!timerToSync || !creds || !listId || tasksInFile.length === 0) {
      clearTrelloAutoSyncTimer(this.doc.uri);
      return;
    }

    scheduleTrelloAutoSync(this.doc.uri, this.deps, this.trelloService, timerToSync);
  }
}
