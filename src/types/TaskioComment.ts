import { Uri } from "vscode";

interface TaskioComment {
  id: string;
  uri: Uri;
  line: number;
  character: number;
  keyword: string;
  text: string;
}

export default TaskioComment;