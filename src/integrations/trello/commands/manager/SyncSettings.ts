import { window, QuickPickItemKind, QuickInputButtons, workspace } from "vscode";
import { TaskioDependencies } from "../../../../types/TaskioDependencies";

import DefaultQuickPick from "../../types/SyncQuickPick";

export default async function SyncSettings(deps: TaskioDependencies) {
    const syncOnSave = workspace.getConfiguration('taskio.trello').get<boolean>('syncOnSave');
    const syncOnStartup = workspace.getConfiguration('taskio.trello').get<boolean>('syncOnStartup');

    const pick = await window.showQuickPick([
        { label: "On Save", kind: QuickPickItemKind.Separator },

        {
            label: `$(zap) Auto-Sync on Save`,
            description: syncOnSave ? "Enabled" : "Disabled",
            detail: "Sync changed tasks to Trello every time you save a file",
            action: "toggle_auto_sync"
        },


        { label: "On Startup", kind: QuickPickItemKind.Separator },

        {
            label: `$(rocket) Auto-Sync on Startup`,
            description: syncOnStartup ? "Enabled" : "Disabled",
            detail: "Sync all tasks to Trello when VS Code starts",
            action: "toggle_startup_sync"
        },

    ] as DefaultQuickPick[], {
        title: "Sync Settings",
        placeHolder: "Configure when tasks are synced with Trello",
        matchOnDescription: true,
        matchOnDetail: true,
    });

    if (!pick) return;

    switch (pick.action) {

        case "toggle_auto_sync":
            await handleToggle(deps, "syncOnSave", "Auto-Sync on Save", () => SyncSettings(deps));
            break;

        case "toggle_startup_sync":
            await handleToggle(deps, "syncOnStartup", "Auto-Sync on Startup", () => SyncSettings(deps));
            break;
    }
}

async function handleToggle(deps: TaskioDependencies, configKey: "syncOnSave" | "syncOnStartup", title: string, screenToGoBack: () => Promise<void>) {
    const current = workspace.getConfiguration('taskio.trello').get<boolean>(configKey);

    const quickPick = window.createQuickPick<DefaultQuickPick>();

    quickPick.title = title;
    quickPick.placeholder = `Currently: ${current ? "Enabled" : "Disabled"}`;

    quickPick.items = [
        {
            label: "$(check) Enabled",
            detail: "Taskio will sync automatically",
            value: true
        },

        {
            label: "$(circle-slash) Disabled",
            detail: "Only sync manually via Manage Integration",
            value: false
        },

    ];
    
    quickPick.buttons = [QuickInputButtons.Back];

    quickPick.onDidTriggerButton(async (button) => {
        if (button === QuickInputButtons.Back) {
            quickPick.hide();
            await screenToGoBack();
        }
    });

    quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0];
        
        if (!selected) return;

        await workspace.getConfiguration('taskio.trello').update(configKey, selected.value ?? false);
        window.showInformationMessage(`Taskio: ${title} set to ${selected.value ? "Enabled" : "Disabled"}`);

        quickPick.hide();
    });

    quickPick.show();
}