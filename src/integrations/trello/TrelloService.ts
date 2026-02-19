import SecretStore from "./SecretStorage";
import TrelloBoard from "./types/Board";
import { TrelloList } from "./types/List";


export class TrelloService {

  private baseUrl = "https://api.trello.com/1";

  constructor(private secretStore: SecretStore) {}

  private async getCredentials() {
    const creds = await this.secretStore.getTrelloCredentials();
    if (!creds) throw new Error("Trello not configured");

    return creds;
  }

  async validate() {
    const { apiKey, token } = await this.getCredentials();

    const res = await fetch(`${this.baseUrl}/members/me?key=${apiKey}&token=${token}`);

    return res.ok;
  }

  async getBoards(): Promise<TrelloBoard[]> {
    const { apiKey, token } = await this.getCredentials();

    const res = await fetch(`${this.baseUrl}/members/me/boards?key=${apiKey}&token=${token}`);

    if (!res.ok) throw new Error("Failed to fetch boards");

    return res.json() as Promise<TrelloBoard[]>;
  }

  async getLists(boardId: string): Promise<TrelloList[]> {
    const { apiKey, token } = await this.getCredentials();

    const res = await fetch(`${this.baseUrl}/boards/${boardId}/lists?key=${apiKey}&token=${token}`);

    if (!res.ok) throw new Error("Failed to fetch lists");

    return res.json() as Promise<TrelloList[]>;
  }

  async createCard(listId: string, name: string, desc?: string) {
    const { apiKey, token } = await this.getCredentials();

    const res = await fetch(`${this.baseUrl}/cards?key=${apiKey}&token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idList: listId,
          name,
          desc
        })
      }
    );

    if (!res.ok) throw new Error("Failed to create card");

    return res.json();
  }
}

