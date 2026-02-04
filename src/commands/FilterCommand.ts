import { CommentStore } from "../store/CommentStore";
import { CommentNode } from "../treeView/TreeNode";

// TODO!!: create the filter command
export default function FilterCommand(comment: CommentNode, filter: string, store: CommentStore) {
    const comments = store.getAll();

    
}