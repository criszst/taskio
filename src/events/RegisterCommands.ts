import { ExtensionContext, Uri, commands, env, window } from 'vscode';

import TreeViewMode from '../types/TreeViewMode';

import CopyComment from '../commands/CopyComment';
import RevealComment from '../commands/RevealComment';
import SearchTasks from '../commands/SearchTasks';

import RemoveTask from '../commands/RemoveTask';

import { TaskioDependencies } from '../types/TaskioDependencies';
import ExportTasks from '../commands/ExportTasks';
import { CommentNode } from '../treeView/TreeNode';
import SendTask from '../integrations/trello/commands/SendTask';
import { setupTrello } from '../integrations/trello/commands/configs/SetupTrello';
import ManageIntegration from '../integrations/trello/commands/configs/ManageIntegration';

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
      const mode: { label: string; value: string; } | undefined = await window.showQuickPick(
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

      if (!exportFormat) return;

      await ExportTasks(deps.store, exportFormat?.value || 'txt');
    }),

    commands.registerCommand('taskio.RemoveTask',
      async (node: CommentNode) => {
        const result = await RemoveTask(node.comment, deps.store);

        if (!result.ok) {
          window.showErrorMessage(`Taskio: Failed to remove task — ${result.error}`);
          return;
        }

        deps.treeProvider.refresh();
        window.showInformationMessage('Taskio: Task removed!');
      }
    ),

    commands.registerCommand('taskio.Refresh',
      () => deps.treeProvider.refresh()
    ),


    //#region TRELLO COMMANDS

    commands.registerCommand('taskio.trello.ManageIntegration', async () => {
      await ManageIntegration(deps);
    }),

    commands.registerCommand('taskio.trello.SetupIntegration',
      async () => {
        await setupTrello(deps.secretStore, deps);
      }
    ),

    commands.registerCommand('taskio.trello.SendTask',
      async (node: CommentNode) => {
        await SendTask(node, deps);
      }
    ),

    commands.registerCommand('taskio.trello.OpenCard', async (node: CommentNode) => {
      if (node.comment.trelloCardId) {
        const url = `https://trello.com/c/${node.comment.trelloCardId}`;
        env.openExternal(Uri.parse(url));
      }
    }
    ),

    //#endregion TRELLO COMMANDS

  );
}
