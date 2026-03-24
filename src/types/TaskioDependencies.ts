import * as vscode from 'vscode';

import { ApplyDecorators } from "../decoration/ApplyDecorators";
import { CommentStore } from "../store/CommentStore";
import { TreeProvider } from "../treeView/TreeProvider";
import updateTreeTitle from "../utils/TreeTitle";
import SecretStore from '../integrations/trello/services/SecretStorage';

export type TaskioDependencies = {
  store: CommentStore;
  treeProvider: TreeProvider;
  treeView: vscode.TreeView<any>;
  applyDecorators: typeof ApplyDecorators;
  updateTreeTitle: typeof updateTreeTitle;
  secretStore: SecretStore;
  context: vscode.ExtensionContext;
};