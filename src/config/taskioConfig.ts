import * as vscode from 'vscode';
import TaskioPriority from '../types/TaskioPriority';

export function getTaskioConfig() {
  const config = vscode.workspace.getConfiguration('taskio');

  return {
    taskListLocation: config.get<string>('taskListLocation', 'Side Panel'),
    enableNotifications: config.get<boolean>('enableNotifications', true),
    keywords: config.get<string[]>('keywords', ['TODO', 'FIXME', 'BUG']),
    color: config.get<string>('color', '#6042f5'),
    enhanceAllText: config.get<boolean>('enhanceAllText', false),

    priorityMarkers: config.get<Record<TaskioPriority, string>>('priorityMarkers', {
      high: '!!!',
      medium: '!!',
      low: '!',
      default: '',
    }),
  }
}
