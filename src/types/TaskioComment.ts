import { Uri } from "vscode";
import TaskioPriority from "./TaskioPriority";

export type TaskioSyncStatus = "never_synced" | "synced" | "modified" | "syncing" | "error";

interface TaskioComment {
  id: string;
  localStableId: string;
  uri: Uri;
  line: number;
  character: number;
  keyword: string;
  text: string;
  displayText?: string;
  priority: TaskioPriority;

  // TRELLO
  trelloCardId?: string;
  lastSyncedText?: string;
  lastSyncedMetadataHash?: string;
  lastError?: string;
  syncStatus: TaskioSyncStatus;
}

export default TaskioComment;
