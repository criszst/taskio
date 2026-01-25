import * as vscode from 'vscode';
import { CommentStore } from '../store/CommentStore';

export default function updateTreeTitle(treeView: vscode.TreeView<any>, store: CommentStore) {
  const count = store.getAll().length;
  treeView.title = count > 0 ? `Tree View (${count})` : 'Tree View';
}
