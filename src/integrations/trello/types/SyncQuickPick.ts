import { QuickPickItem } from "vscode";

export default interface SyncQuickPickItem extends QuickPickItem {
    action?: string;
    value?: any;
}