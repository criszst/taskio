import * as vscode from 'vscode';

import TreeViewMode from '../types/TreeViewMode';

import CopyComment from '../commands/CopyComment';
import RevealComment from '../commands/RevealComment';
import SearchTasks from '../commands/SearchTasks';

import { TaskioDependencies } from '../types/TaskioDependencies';
import ExportTasks from '../commands/ExportTasks';

export function registerCommands(context: vscode.ExtensionContext, deps: TaskioDependencies) {

  context.subscriptions.push(
    vscode.commands.registerCommand('taskio.revealComment',
      comment => RevealComment(comment)
    ),

    vscode.commands.registerCommand('taskio.copyComment',
      comment => CopyComment(comment)
    ),

    vscode.commands.registerCommand('taskio.searchTasks',
      () => SearchTasks(deps.store)
    ),

    vscode.commands.registerCommand('taskio.organize', async () => {
      const mode = await vscode.window.showQuickPick(
        [
          { label: 'Tree View', value: 'tree' },
          { label: 'Files', value: 'files' },
          { label: 'Folders', value: 'folders' },
          { label: 'List', value: 'list' },
        ],
        { placeHolder: 'Organize Taskio by...' }
      );

      if (!mode) return;
      deps.treeProvider.setMode(mode.value as TreeViewMode);
    }),

    vscode.commands.registerCommand('taskio.exportTasks', async () => {
      const exportFormat = await vscode.window.showQuickPick(
        [
          { label: 'Plain Text (.txt)', value: 'txt' },
          { label: 'Markdown (.md)', value: 'md' },
          { label: 'JSON (.json)', value: 'json' },
        ],

        { placeHolder: 'Select export format' },
      );


      await ExportTasks(deps.store, exportFormat?.value || 'txt');
    })

  );
}
