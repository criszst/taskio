export default interface TrelloCard {
  listId: string;
  name: string;
  description?: string;
  priority?: string;
  labels?: string[];
}
