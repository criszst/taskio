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
        prompt: "You can only select one board at the moment, but you can change it later in the settings. Press ESC to exit.",
        ignoreFocusOut: true 
    }
  );

  if (!boardPick) return vscode.window.showWarningMessage("No board selected.");
  

  const lists = await trello.getLists(boardPick.boardId);
  
  const listPick = await vscode.window.showQuickPick(
    lists.map(l => ({
      label: l.name,
      description: `Current Board: ${boardPick.label}`,
      listId: l.id
    })),
    { 
        placeHolder: "Step 2/2: Select a Target List for Tasks",
        prompt: "This is the list where your tasks will be sent. You can change it later in the settings. Press ESC to exit.",
        ignoreFocusOut: true 
    }
  );

  if (!listPick) return vscode.window.showWarningMessage("No list selected.");

  await context.workspaceState.update("taskio.trello.boardId", boardPick.boardId);
  await context.workspaceState.update("taskio.trello.boardName", boardPick.label);

  await context.workspaceState.update("taskio.trello.listId", listPick.listId);
  await context.workspaceState.update("taskio.trello.listName", listPick.label);

  vscode.window.showInformationMessage(`Tasks will now be sent to: ${boardPick.label} > ${listPick.label}`);
}
