import * as vscode from "vscode";
import SecretStore from "../../services/SecretStorage";
import { TrelloService } from "../../services/TrelloService";
import SelectBoardList from "../manager/SelectBoardList";
import { TaskioDependencies } from "../../../../types/TaskioDependencies";

export async function setupTrello(secretStore: SecretStore, deps: TaskioDependencies) {
  const { context } = deps;

  const getTrelloCreds = await secretStore.getTrelloCredentials();

  if (getTrelloCreds) {
    const trello = new TrelloService(secretStore);
    const valid = await trello.validate();

    if (valid) {
      await SelectBoardList(trello, context);
      return;
    }
  }

  // yes its to be intended public
  const API_KEY = "4edfd07cbe84b5604acc8b00782358e5";

  const authUrl = `https://trello.com/1/authorize?expiration=never&name=Taskio&scope=read,write&response_type=token&key=${API_KEY}`;

  await vscode.env.openExternal(vscode.Uri.parse(authUrl));

  const token = await vscode.window.showInputBox({
    title: "Trello Token",
    prompt: "Paste your generated Trello token. Allow some seconds after authorizing to generate the token.",
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

  await SelectBoardList(trello, context);
}
