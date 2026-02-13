import { ExtensionContext, commands, window } from 'vscode';

import TreeViewMode from '../types/TreeViewMode';

import CopyComment from '../commands/CopyComment';
import RevealComment from '../commands/RevealComment';
import SearchTasks from '../commands/SearchTasks';

import RemoveTask from '../commands/RemoveTask';

import { TaskioDependencies } from '../types/TaskioDependencies';
import ExportTasks from '../commands/ExportTasks';
import { CommentNode } from '../treeView/TreeNode';

export function registerCommands(context: ExtensionContext, deps: TaskioDependencies) {
  context.subscriptions.push(
    commands.registerCommand('taskio.RevealComment',
      comment => RevealComment(comment)
    ),

    commands.registerCommand('taskio.CopyComment',
      comment => CopyComment(comment)
    ),

    commands.registerCommand('taskio.SearchTasks',
      () => SearchTasks(deps.store)
    ),

    commands.registerCommand('taskio.Organize', async () => {
      const mode = await window.showQuickPick(
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

    commands.registerCommand('taskio.ExportTasks', async () => {
      const exportFormat = await window.showQuickPick(
        [
          { label: 'Plain Text (.txt)', value: 'txt' },
          { label: 'Markdown (.md)', value: 'md' },
          { label: 'JSON (.json)', value: 'json' },
        ],

        { placeHolder: 'Select export format' },
      );


      await ExportTasks(deps.store, exportFormat?.value || 'txt');
    }),

    commands.registerCommand('taskio.RemoveTask',
      async (node: CommentNode) => {
        const result = await RemoveTask(node.comment, deps.store);

        if (!result.ok) {
          window.showErrorMessage(`Taskio failed to remove task: ${result.error}`);
        }

        deps.treeProvider.refresh();
        window.showInformationMessage('Taskio: Task removed!');
      }
    ),

    commands.registerCommand('taskio.Refresh',
      () => deps.treeProvider.refresh()
    ),

  );
}
