import * as vscode from "vscode";
import SecretStore from "../SecretStorage";
import { TrelloService } from "../TrelloService";
import SelectBoardList from "./BoardList";

export async function setupTrello(secretStore: SecretStore) {

 const API_KEY = "4edfd07cbe84b5604acc8b00782358e5";

  const authUrl = `https://trello.com/1/authorize?expiration=never&name=Taskio&scope=read,write&response_type=token&key=${API_KEY}`;

  await vscode.env.openExternal(vscode.Uri.parse(authUrl));

  const token = await vscode.window.showInputBox({
    title: "Trello Token",
    prompt: "Paste your generated Trello token",
    ignoreFocusOut: true,
  });

  if (!token) return vscode.window.showErrorMessage("Trello token not provided.");

  await secretStore.saveTrelloCredentials(API_KEY, token);

  const trello = new TrelloService(secretStore);
  const valid = await trello.validate();

  if (!valid) {
    vscode.window.showErrorMessage("Invalid Trello credentials.");
    return;
  }

  vscode.window.showInformationMessage("Trello connected successfully 🚀");

  await SelectBoardList(trello);
}
