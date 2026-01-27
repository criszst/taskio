
import TreeViewMode from '../types/TreeViewMode';
import { TreeProvider } from '../treeView/TreeProvider';

export default function OrganizeCommand(mode: TreeViewMode, provider: TreeProvider) {
  provider.setMode(mode);
  provider.refresh();
}