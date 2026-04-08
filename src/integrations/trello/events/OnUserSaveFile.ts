import { TextDocument, workspace } from "vscode";
import { TaskioDependencies } from "../../../types/TaskioDependencies";
import SyncService from "../services/SyncService";
import { TrelloService } from "../services/TrelloService";

export default class OnUserSaveFile {
  private syncService: SyncService;

  constructor(private doc: TextDocument, private deps: TaskioDependencies) {
    this.syncService = new SyncService(new TrelloService(deps.secretStore));
  }

  public async handle(): Promise<void> {
    const syncOnSave = workspace.getConfiguration('taskio.trello').get<boolean>('syncOnSave');
    console.log("Sync on save is " + (syncOnSave ? "enabled" : "disabled"));

    if (!syncOnSave) return;

    const tasks = this.deps.store.getByUri(this.doc.uri);

    if (tasks.length === 0) return;

    await this.syncService.processTasksSilent(tasks, this.deps, 'sync');
    await this.deps.context.workspaceState.update("taskio.comments", this.deps.store.getAll());
  }
}