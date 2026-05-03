import * as crypto from "crypto";
import * as vscode from "vscode";

type PendingAuth = {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  timeout: NodeJS.Timeout;
};

const pendingByState = new Map<string, PendingAuth>();
let pendingAny: PendingAuth | undefined;

export function createTrelloAuthState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function waitForTrelloAuthToken(state?: string, opts?: { timeoutMs?: number }): Promise<string> {
  const timeoutMs = opts?.timeoutMs ?? 2 * 60 * 1000;

  return new Promise<string>((resolve, reject) => {
    if (state) {
      const existing = pendingByState.get(state);
      if (existing) {
        clearTimeout(existing.timeout);
        pendingByState.delete(state);
      }
    } else if (pendingAny) {
      clearTimeout(pendingAny.timeout);
      pendingAny = undefined;
    }

    const timeout = setTimeout(() => {
      if (state) pendingByState.delete(state);
      else pendingAny = undefined;
      reject(new Error("Timed out waiting for Trello authorization."));
    }, timeoutMs);

    const pending = { resolve, reject, timeout };
    // Trello doesn't always round-trip `state` for fragment callbacks, so keep a fallback "any" pending request.
    if (state) pendingByState.set(state, pending);
    pendingAny = pending;
  });
}

export function cancelTrelloAuth(state: string) {
  const pending = pendingByState.get(state) ?? pendingAny;
  if (!pending) return;

  clearTimeout(pending.timeout);
  pendingByState.delete(state);
  pendingAny = undefined;
  pending.reject(new Error("Authorization cancelled."));
}

export function registerTrelloUriHandler(): vscode.Disposable {
  return vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      if (uri.path !== "/trello-auth") return;

      const params = new URLSearchParams(uri.query);
      const token = params.get("token") ?? "";
      const state = params.get("state") ?? "";

      if (!token) {
        void vscode.window.showErrorMessage("Taskio: Invalid Trello callback (missing token).");
        return;
      }

      const pending =
        (state ? pendingByState.get(state) : undefined) ??
        // Trello doesn't always round-trip custom state, so allow a single pending auth.
        pendingAny;
      if (!pending) {
        void vscode.window.showWarningMessage(
          "Taskio: Trello authorization received, but there is no pending auth request. Run “Configure Trello Connection” again."
        );
        return;
      }

      clearTimeout(pending.timeout);
      if (state) pendingByState.delete(state);
      else pendingAny = undefined;
      pending.resolve(token);
    },
  });
}
