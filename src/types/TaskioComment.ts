import { Uri } from "vscode";
import TaskioPriority from "./TaskioPriority";

interface TaskioComment {
  id: string;
  uri: Uri;
  line: number;
  character: number;
  keyword: string;
  text: string;
  displayText?: string;
  priority: TaskioPriority;

  // TRELLO
  trelloCardId?: string;
  syncStatus: "local" | "synced" | "error";
}

export default TaskioComment;