import { getTaskioConfig } from "../../config/GetConfig";
import TaskioComment from "../../types/TaskioComment";

import { version } from '../../../package.json';

type ExportedTask = {
  path: string;
  line: number;
  displayText?: string;
  description?: string;
  priority: string;
};

export default async function ExportToJson(comments: TaskioComment[]): Promise<string> {
  const { keywords } = getTaskioConfig();

  const pattern = new RegExp(`^\\s*(?:${keywords.join('|')})\\s*:?\s*`, 'i');

  const orderNumber = {
    high: 0,
    medium: 1,
    low: 2,
    default: 3
  };

  const sorted = [...comments].sort(
    (a, b) => orderNumber[a.priority] - orderNumber[b.priority]
  );


  const tasks: ExportedTask[] = sorted.map(comment => ({
    path: comment.uri.fsPath,
    line: comment.line + 1,
    text: comment.text.replace(/^\s*(\/\/+|\/\*+|\*+|\*\/)\s?/, '').trim(),
    description: comment.displayText?.replace(pattern, '').trim(),
    priority: comment.priority
  }));

  return JSON.stringify({
    name: 'taskio',
    version: version,
    generatedAt: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
    total: tasks.length,
    tasks
  }, null, 2);
}
