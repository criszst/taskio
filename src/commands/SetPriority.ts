import { commands, window } from "vscode";
import { CommentStore } from "../store/CommentStore";
import TaskioComment from "../types/TaskioComment";
import TaskioPriority from "../types/TaskioPriority";
import { ApplyDecorators } from "../decoration/ApplyDecorators";
import { CommentNode } from "../treeView/TreeNode";

export function setPriority(store: CommentStore, priority: TaskioPriority) {
  return (node: CommentNode | TaskioComment) => {
    if (!node) return;
    
  
    const comment = node instanceof CommentNode ? node.comment : node;
    
    if (!comment) return;
    
    store.setPriority(comment.id, priority);
    
    const editor = window.activeTextEditor;
    if (editor && editor.document.uri.fsPath === comment.uri.fsPath) {
      ApplyDecorators(editor, store);
    }
    

    commands.executeCommand('taskio.refreshDecorations');
  }
}