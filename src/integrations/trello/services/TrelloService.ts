import SecretStore from "./SecretStorage";

import TrelloBoard from "../types/Board";
import TrelloCard from "../types/Card";

import { TrelloList } from "../types/List";




export class TrelloService {

  private baseUrl = "https://api.trello.com/1";

  private PRIORITY_COLOR: Record<string, string> = {
    low: "green",
    medium: "yellow",
    high: "red",
  };

  constructor(private secretStore: SecretStore) { }

  private async getCredentials() {
    const creds = await this.secretStore.getTrelloCredentials();
    if (!creds) throw new Error("Trello not configured");

    return creds;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const { apiKey, token } = await this.getCredentials();
    const separator = path.includes("?") ? "&" : "?";

    const res = await fetch(`${this.baseUrl}${path}${separator}key=${apiKey}&token=${token}`, options);

    if (!res.ok) throw new Error(`Trello API error: ${res.status} ${res.statusText}`);

    return res.json() as Promise<T>;
  }


  async validate() {
    const request = await this.request("/members/me");

    return true ? request : false;
  }

  async getBoards(): Promise<TrelloBoard[]> {
    return this.request("/members/me/boards");
  }

  async getLists(boardId: string): Promise<TrelloList[]> {
    return this.request(`/boards/${boardId}/lists`);
  }

  async createCard(body: TrelloCard): Promise<any> {
    const labelColor = body.priority ? this.PRIORITY_COLOR[body.priority.toLowerCase()] : undefined;

    return this.request("/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({
        idList: body.listId,
        name: body.name,
        desc: body.description,
        labels: labelColor ? [labelColor] : [],
      }),

    });
  }

  async updateCard(cardId: string, body: Partial<TrelloCard>): Promise<any> {
    return this.request(`/cards/${cardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: body.name,
        desc: body.description,
      }),
    });
  }


  async deleteCard(cardId: string): Promise<void> {
    await this.request(`/cards/${cardId}`, { method: "DELETE" });
  }
}

