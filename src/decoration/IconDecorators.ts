import { ThemeColor, ThemeIcon } from "vscode";

import TaskioPriority from "../types/TaskioPriority";
import TaskioComment, { TaskioSyncStatus } from "../types/TaskioComment";

export function getIconByPriority(priority: TaskioPriority): ThemeIcon {
  switch (priority) {
    case 'high':
      return new ThemeIcon('circle-filled', new ThemeColor('charts.red'));

    case 'medium':
      return new ThemeIcon('circle-filled', new ThemeColor('charts.yellow'));

    case 'low':
      return new ThemeIcon('circle-filled', new ThemeColor('charts.green'));

    default:
      return new ThemeIcon('circle-filled', new ThemeColor('charts.grey'));
  }
}


export function getIconByKeyword(comment: TaskioComment): ThemeIcon {

  const keyword = comment.keyword

  // just a POG (programacao orientada a gambiarra)
  const cleanKeyword = keyword.toUpperCase().slice(2, comment.keyword.length).trim();

  switch (cleanKeyword) {
    case 'BUG':
      return new ThemeIcon('bug')
    case 'FIXME':
      return new ThemeIcon('tools')
    case 'TODO':
      return new ThemeIcon('check')
    case 'NOTE':
      return new ThemeIcon('note')
    case 'HACK':
      return new ThemeIcon('flame')
    case 'ERROR':
      return new ThemeIcon('error')
    default:
      return new ThemeIcon('check')
  }
}

export function getEmojiByPriority(priority: TaskioPriority): string {
  switch (priority) {
    case 'high':
      return '🔴'
    case 'medium':
      return '🟡'
    case 'low':
      return '🟢';
    default:
      return '';
  }
}


export function getIconBySynced(status: TaskioSyncStatus, priority: TaskioPriority): ThemeIcon | undefined {
  switch (status) {
    case "synced":
      const priorityColors = {
        "high": new ThemeColor("charts.red"),
        "medium": new ThemeColor("charts.yellow"),
        "low": new ThemeColor("charts.green"),
        "default": new ThemeColor("charts.grey"),
      }

      return new ThemeIcon("pass-filled", priorityColors[priority]);
    case "modified":
      return new ThemeIcon("warning", new ThemeColor("charts.yellow"));

    case "syncing":
      return new ThemeIcon("sync~spin", new ThemeColor("charts.blue"));

    case "error":
      return new ThemeIcon("error", new ThemeColor("charts.red"));

    default:
      return undefined;
  }
}
