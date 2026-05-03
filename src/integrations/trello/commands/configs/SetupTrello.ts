import * as vscode from "vscode";
import SecretStore from "../../services/SecretStorage";
import { TrelloService } from "../../services/TrelloService";
import SelectBoardList from "../manager/SelectBoardList";
import { TaskioDependencies } from "../../../../types/TaskioDependencies";
import { cancelTrelloAuth, createTrelloAuthState, waitForTrelloAuthToken } from "../../services/TrelloAuthUri";

let trelloAuthInProgress = false;

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

  let token: string | undefined;
  try {
    if (trelloAuthInProgress) {
      void vscode.window.showInformationMessage("Taskio: Trello authorization is already in progress.");
      return;
    }

    trelloAuthInProgress = true;

    // Trello doesn't reliably round-trip custom "state" with callback_method=fragment.
    // We still generate one (helps when it does), but the handler also supports a single pending auth without state.
    const state = `${createTrelloAuthState()}.${vscode.env.uriScheme}`;

    const returnUrl = "https://criszst.github.io/taskio-auth/";

    const authUrl =
      `https://trello.com/1/authorize?expiration=never&name=Taskio&scope=read,write&response_type=token` +
      `&key=${API_KEY}` +
      `&callback_method=fragment&return_url=${encodeURIComponent(returnUrl)}` +
      `&state=${encodeURIComponent(state)}`;

    await vscode.env.openExternal(vscode.Uri.parse(authUrl));

    token = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Taskio: Waiting for Trello authorization in your browser…",
        cancellable: true,
      },
      async (_progress, cancel) => {
        cancel.onCancellationRequested(() => cancelTrelloAuth(state));
        return await waitForTrelloAuthToken(state, { timeoutMs: 2 * 60 * 1000 });
      }
    );
  } catch {
    token = undefined;
  } finally {
    trelloAuthInProgress = false;
  }

  if (!token) {
    token = await vscode.window.showInputBox({
      title: "Trello Token",
      prompt:
        "Paste your Trello token. Tip: if the browser callback failed, you can still generate a token from the Trello authorization page.",
      ignoreFocusOut: true,
    });
  }

  if (!token) return vscode.window.showErrorMessage("Trello token not provided.");

  await secretStore.saveTrelloCredentials(API_KEY, token);

  const trello = new TrelloService(secretStore);
  const valid = await trello.validate();

  if (!valid) {
    await secretStore.removeTrelloCredentials();
    vscode.window.showErrorMessage("Invalid Trello credentials.");
    return;
  }

  vscode.window.showInformationMessage("Trello connected successfully 🚀");

  await SelectBoardList(trello, context);
}
