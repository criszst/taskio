import { TreeView } from 'vscode';

import { CommentStore } from '../store/CommentStore';

export default function updateTreeTitle(treeView: TreeView<any>, store: CommentStore, title?: string): void {
  const count = store.getAll().length;
  
  treeView.title = title ? `${title} (${count})` : `Tree View (${count})`;
}
