import { ThemeColor, ThemeIcon } from "vscode";

import TaskioPriority from "../types/TaskioPriority";
import TaskioComment from "../types/TaskioComment";

export function getIconByPriority(priority: TaskioPriority): ThemeIcon {
  switch (priority) {
    case 'high':
      return new ThemeIcon('circle-filled', new ThemeColor('charts.red'));

    case 'medium':
      return new ThemeIcon('circle-filled', new ThemeColor('charts.yellow'));

    case 'low':
      return new ThemeIcon('circle-filled', new ThemeColor('charts.green'));

    default:
      return new ThemeIcon('circle-outline');
  }
}


export function getIconByKeyword(comment: TaskioComment): ThemeIcon {

  const keyword = comment.keyword

  // FIXME: getIconByKeyword (bug, fixme...) not working correctly, bc the ScanDocumment returns the keyword + comment block (like // BUG instead only "BUG")
  // in certain files like jsx, ts and so on, work perfectly. But in python with the comment block like #, just turn into awfull code

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


export function getIconBySynced(status: "synced" | "error" | "local", priority: TaskioPriority): ThemeIcon | undefined {
  switch (status) {
    case "synced":
      const priorityColors = {
        "high": new ThemeColor("charts.red"),
        "medium": new ThemeColor("charts.yellow"),
        "low": new ThemeColor("charts.green"),
        "default": new ThemeColor("charts"),
      }

      return new ThemeIcon("pass-filled", priorityColors[priority]);
      
    case "error":
      return new ThemeIcon("error", new ThemeColor("charts.red"));

    default:
      return undefined;
  }
}