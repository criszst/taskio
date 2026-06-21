import { QuickInputButtons, QuickPickItemKind, window, workspace } from "vscode";
import { TaskioDependencies } from "../../../../types/TaskioDependencies";

import { describeTrelloAutoSyncSetting, getTrelloAutoSyncSetting } from "../../services/TimerToSync";
import DefaultQuickPick from "../../types/SyncQuickPick";

export default async function SyncSettings(deps: TaskioDependencies) {
    const timerToSync = getTrelloAutoSyncSetting();
    const syncOnStartup = workspace.getConfiguration('taskio.trello').get<boolean>('syncOnStartup') ?? false;

    const pick = await window.showQuickPick([
        { label: "Auto-Sync Timer", kind: QuickPickItemKind.Separator },

        {
            label: `$(zap) Auto-Sync Timer`,
            description: describeTrelloAutoSyncSetting(timerToSync),
            detail: "Sync changed tasks to Trello after a save, using the selected delay.",
            action: "configure_timer"
        },

        { label: "On Startup", kind: QuickPickItemKind.Separator },

        {
            label: `$(rocket) Auto-Sync on Startup`,
            description: syncOnStartup ? "Enabled" : "Disabled",
            detail: "Sync all tasks to Trello when VS Code starts.",
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
        case "configure_timer":
            await handleTimerToggle("Auto-Sync Timer", () => SyncSettings(deps));
            break;

        case "toggle_startup_sync":
            await handleBooleanToggle("syncOnStartup", "Auto-Sync on Startup", () => SyncSettings(deps));
            break;
    }
}

async function handleTimerToggle(
    title: string,
    screenToGoBack: () => Promise<void>
) {
    const current = getTrelloAutoSyncSetting();

    const quickPick = window.createQuickPick<DefaultQuickPick>();

    quickPick.title = title;
    quickPick.placeholder = `Currently: ${describeTrelloAutoSyncSetting(current)}`;

    quickPick.items = [
        {
            label: current === 2 ? "$(check) Every 2 minutes" : "Every 2 minutes",
            detail: "Sync automatically 2 minutes after a save",
            value: 2
        },
        {
            label: current === 5 ? "$(check) Every 5 minutes" : "Every 5 minutes",
            detail: "Sync automatically 5 minutes after a save",
            value: 5
        },
        {
            label: current === 10 ? "$(check) Every 10 minutes" : "Every 10 minutes",
            detail: "Sync automatically 10 minutes after a save",
            value: 10
        },
        {
            label: current === false ? "$(circle-slash) Disabled" : "Disabled",
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

        await workspace.getConfiguration('taskio.trello').update('timerToSync', selected.value ?? false);
        window.showInformationMessage(`Taskio: ${title} set to ${selected.value ? `${selected.value} minutes` : "Disabled"}`);

        quickPick.hide();
    });

    quickPick.show();
}

async function handleBooleanToggle(
    configKey: "syncOnStartup",
    title: string,
    screenToGoBack: () => Promise<void>
) {
    const current = workspace.getConfiguration('taskio.trello').get<boolean>(configKey) ?? false;

    const quickPick = window.createQuickPick<DefaultQuickPick>();

    quickPick.title = title;
    quickPick.placeholder = `Currently: ${current ? "Enabled" : "Disabled"}`;

    quickPick.items = [
        {
            label: current ? "$(check) Enabled" : "Enabled",
            detail: "Sync automatically when VS Code starts",
            value: true
        },
        {
            label: !current ? "$(circle-slash) Disabled" : "Disabled",
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
