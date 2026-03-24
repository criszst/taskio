import { SecretStorage } from "vscode";


export default class SecretStore {

  constructor(private storage: SecretStorage) { }

  public async saveTrelloCredentials(apiKey: string | undefined, token: string): Promise<void> {
    if (!apiKey) return;

    await this.storage.store("trello_creds", JSON.stringify({ apiKey, token }));
  }

  public async getTrelloCredentials(): Promise<{ apiKey: string, token: string } | null> {
    const data = await this.storage.get("trello_creds");
    return data ? JSON.parse(data) : null;
  }

  public async removeTrelloCredentials(): Promise<void> {
    await this.storage.delete("trello_creds");
  }

}