import * as vscode from "vscode";

import { TrelloService } from "../TrelloService";

export default async function SelectBoardList(trello: TrelloService, context: vscode.ExtensionContext) {

  const boards = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: "Fetching Trello Boards..." },
    () => trello.getBoards()
  );

  const boardPick = await vscode.window.showQuickPick(
    boards.map(b => ({
      label: b.name,
      description: `ID: ${b.id}`,
      boardId: b.id
    })),
    { 
        placeHolder: "Step 1/2: Select a Trello Board",
        ignoreFocusOut: true 
    }
  );

  if (!boardPick) return;




  const lists = await trello.getLists(boardPick.boardId);
  
  const listPick = await vscode.window.showQuickPick(
    lists.map(l => ({
      label: l.name,
      description: `Current Board: ${boardPick.label}`,
      listId: l.id
    })),
    { 
        placeHolder: "Step 2/2: Select a Target List for Tasks",
        ignoreFocusOut: true 
    }
  );

  if (!listPick) return;

  await context.workspaceState.update("taskio.trello.boardId", boardPick.boardId);
  await context.workspaceState.update("taskio.trello.boardName", boardPick.label);

  await context.workspaceState.update("taskio.trello.listId", listPick.listId);
  await context.workspaceState.update("taskio.trello.listName", listPick.label);

  vscode.window.showInformationMessage(`Tasks will now be sent to: ${boardPick.label} > ${listPick.label}`);
}
