import { QuickPickItem } from "vscode";

export default interface DefaultQuickPick extends QuickPickItem {
    action?: string;
    value?: any;
}