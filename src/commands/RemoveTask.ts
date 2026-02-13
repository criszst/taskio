import { window, workspace, WorkspaceEdit } from "vscode";

import { CommentStore } from "../store/CommentStore";
import TaskioComment from "../types/TaskioComment";

type Result<Sucess, Error> = { ok: true, value: Sucess } | { ok: false, error: Error };

const Ok = <Sucess, Error>(value: Sucess): Result<Sucess, Error> => ({ ok: true, value });
const Err = <Sucess, Error>(value: Error): Result<Sucess, Error> => ({ ok: false, error: value });

type AsyncResult<Sucess, Error> = Promise<Result<Sucess, Error>>;

export default async function RemoveTask(comment: TaskioComment, store: CommentStore): AsyncResult<void, string> {
  if (!comment.id) {
    return Err('No comment selected');
  }

  const confirm = await window.showWarningMessage(
    'Are you sure you want to remove this task?',
    { modal: true },
    'Yes'
  );

  if (confirm !== 'Yes') {
    return Ok(undefined);
  }

  try {
    store.remove(comment.id);
    store.refresh();

    const doc = await workspace.openTextDocument(comment.uri);

    const edit = new WorkspaceEdit();
    const line = doc.lineAt(comment.line);

    edit.delete(doc.uri, line.range);

    const success = await workspace.applyEdit(edit);

    if (!success) {
      return Err('Failed to edit document');
    }

    await doc.save();


    return Ok(undefined);

  } catch (error) {
    return Err('Unexpected error while removing task');
  }
}