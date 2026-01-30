import { CommentStore } from "../store/CommentStore";
import { CommentNode } from "../treeView/TreeNode";

export default function FilterCommand(comment: CommentNode, filter: string, store: CommentStore) {
    const comments = store.getAll();

    
}