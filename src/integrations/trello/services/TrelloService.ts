import SecretStore from "./SecretStorage";

import TrelloBoard from "../types/Board";
import TrelloApiCard from "../types/TrelloApiCard";
import TrelloCard from "../types/Card";

import { TrelloList } from "../types/List";

export class TrelloHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = "TrelloHttpError";
  }
}

export type TrelloValidationResult =
  | { ok: true }
  | { ok: false; reason: "unauthorized" | "network" | "service" };




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

    if (!res.ok) {
      let details = "";
      try {
        const text = await res.text();
        details = text ? ` - ${text}` : "";
      } catch {
        // ignore
      }
      throw new TrelloHttpError(`Trello API error: ${res.status} ${res.statusText}${details}`, res.status, details || undefined);
    }

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    if (!text) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }


  async validate(): Promise<TrelloValidationResult> {
    try {
      await this.request("/members/me");
      return { ok: true };
    } catch (error) {
      if (error instanceof TrelloHttpError) {
        if (error.status === 401 || error.status === 403) {
          return { ok: false, reason: "unauthorized" };
        }

        return { ok: false, reason: "service" };
      }

      return { ok: false, reason: "network" };
    }
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

  async getCard(cardId: string, fields?: string[]): Promise<TrelloApiCard> {
    const params = fields ? `?fields=${fields.join(",")}` : "";
    return this.request(`/cards/${cardId}${params}`);
  }

  async updateCard(cardId: string, body: Partial<TrelloCard>): Promise<any> {
    if (!cardId) throw new Error("Missing Trello card id.");

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
