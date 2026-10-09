import TaskioComment from "../../types/TaskioComment";
import { version } from "../../../package.json";

type ExportedTask = {
  path: string;
  line: number;
  text: string;
  description?: string;
  priority: string;
};

function normalizeComment(text: string): string {
  return text
    .trim()
    .replace(/^(?:\/\/+|\/\*+|\*+|#|--|;|<!--)\s*/, '')
    .replace(/\s*(?:\*\/|-->)$/, '')
    .trim();
}

export default async function ExportToJson(comments: TaskioComment[]): Promise<string> {
  const orderNumber = {
    high: 0,
    medium: 1,
    low: 2,
    default: 3,
  };

  const sorted = [...comments].sort((a, b) => orderNumber[a.priority] - orderNumber[b.priority]);

  const tasks: ExportedTask[] = sorted.map(comment => ({
    path: comment.uri.fsPath,
    line: comment.line + 1,

    text: normalizeComment(comment.text),

    description: comment.displayText
      ? normalizeComment(comment.displayText)
      : undefined,

    priority: comment.priority,
  }));

  const now = new Date();

  return JSON.stringify(
    {
      name: "taskio",
      version,
      generatedAt: now.toLocaleString("pt-BR"),
      total: tasks.length,
      tasks,
    },
    null,
    2
  );
}