import * as vscode from 'vscode';

import { TreeProvider } from '../treeView/TreeProvider';
import updateTreeTitle from '../utils/TreeTitle';

import { CommentStore } from '../store/CommentStore';

import { ApplyDecorators } from '../decoration/ApplyDecorators';

import { TaskioDependencies } from '../types/TaskioDependencies';

export default function createDeps(): TaskioDependencies {
  const store = new CommentStore();
  const treeProvider = new TreeProvider(store);

  const treeView = vscode.window.createTreeView('taskioView', {
    treeDataProvider: treeProvider
  });

   treeProvider.attachTreeView(treeView);

  return {
    store,
    treeProvider,
    treeView,
    applyDecorators: ApplyDecorators,
    updateTreeTitle
  };
}
