import * as vscode from "vscode";

import { TrelloService } from "../TrelloService";

export default async function SelectBoardList(trello: TrelloService) {

  const boards = await trello.getBoards();

  const boardPick = await vscode.window.showQuickPick(
    boards.map(b => ({
      label: b.name,
      description: b.url,
      boardId: b.id
    })),
    { placeHolder: "Select a Trello board" }
  );

  if (!boardPick) return;

  const lists = await trello.getLists(boardPick.boardId);

  const listPick = await vscode.window.showQuickPick(
    lists.map(l => ({
      label: l.name,
      listId: l.id
    })),
    { placeHolder: "Select a Trello list" }
  );

  if (!listPick) return;

  await vscode.workspace.getConfiguration().update(
    "taskio.trello.listId",
    listPick.listId,
    vscode.ConfigurationTarget.Global
  );

  vscode.window.showInformationMessage("Board and list saved successfully ✅");
}
