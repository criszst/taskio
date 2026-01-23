import { ThemeIcon } from "vscode";

import TaskioPriority from "../types/TaskioPriority";

export function getIconByPriority(priority: TaskioPriority): ThemeIcon {
  switch (priority) {
    case 'high':
      return new ThemeIcon(
        'circle-filled',
        new ThemeIcon('charts.red')
      );

    case 'medium':
      return new ThemeIcon(
        'circle-filled',
        new ThemeIcon('charts.yellow')
      );

    case 'low':
      return new ThemeIcon(
        'circle-filled',
        new ThemeIcon('charts.green')
      );

    default:
      return new ThemeIcon('circle-outline');
  }
}


export function getIconByKeyword(keyword: string): ThemeIcon {
  switch (keyword.toUpperCase()) {
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