import { window, QuickPickItemKind, QuickInputButtons } from "vscode";
import { TaskioDependencies } from "../../../../types/TaskioDependencies";

import SyncQuickPickItem from "../../types/SyncQuickPick";


export default async function SyncSettings(deps: TaskioDependencies) {
    const quickPick = window.createQuickPick<SyncQuickPickItem>();
    
    quickPick.title = "Sync Settings";
    quickPick.placeholder = "Configure Trello Sync Behavior";
    

    quickPick.items = [
        { label: "Automation", kind: QuickPickItemKind.Separator },
        { label: "$(zap) Auto-Sync on Save", action: "toggle_auto_sync" },
        { label: "Filters & Rules", kind: QuickPickItemKind.Separator },
        { label: "$(filter) Minimum Priority to Sync", action: "set_min_priority" },
        { label: "Workflow", kind: QuickPickItemKind.Separator },
        { label: "$(trash) Cleanup Behavior", action: "set_cleanup_rule" }
    ];


    quickPick.buttons = [QuickInputButtons.Back];


    quickPick.onDidTriggerButton(async (button) => {
        if (button === QuickInputButtons.Back) {
            quickPick.hide();

            const ManageIntegration = require("../configs/ManageIntegration").default; 
            await ManageIntegration(deps);
        }
    });


    quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0];
        if (!selected) return;

        quickPick.hide();

        switch (selected.action) {
            case "toggle_auto_sync":
                await handleToggleAutoSync(deps);
                break;
            case "set_min_priority":
                await handleMinPriority(deps);
                break;
            case "set_cleanup_rule":
                await handleCleanupRule(deps);
                break;
        }
    });

    quickPick.show();
}


async function handleToggleAutoSync(deps: TaskioDependencies) {
    const qp = window.createQuickPick<SyncQuickPickItem>();
    qp.title = "Auto-Sync on Save";
    qp.buttons = [QuickInputButtons.Back];
    qp.items = [
        { label: "Enabled", description: "Sync tasks every time you save a file", value: true },
        { label: "Disabled", description: "Only sync tasks manually", value: false }
    ];

    qp.onDidTriggerButton(async (button) => {
        if (button === QuickInputButtons.Back) {
            qp.hide();
            await SyncSettings(deps);
        }
    });

    qp.onDidAccept(() => {
        // TODO!!: implement the auto sync toggle logic and save to workspaceState
        const selected = qp.selectedItems[0];
        window.showInformationMessage(`Auto-Sync set to: ${selected.label}`);
        qp.hide();
    });

    qp.show();
}

async function handleMinPriority(deps: TaskioDependencies) {
    const qp = window.createQuickPick<SyncQuickPickItem>();
    qp.title = "Minimum Sync Priority";
    qp.buttons = [QuickInputButtons.Back];
    qp.items = [
        { label: "$(info) All Tasks", value: "low" },
        { label: "$(warning) Medium & High", value: "medium" },
        { label: "$(error) High Only", value: "high" }
    ];

    qp.onDidTriggerButton(async (button) => {
        if (button === QuickInputButtons.Back) {
            qp.hide();
            await SyncSettings(deps);
        }
    });

    qp.onDidAccept(() => {
        window.showInformationMessage(`Threshold updated.`);
        qp.hide();
    });

    qp.show();
}

async function handleCleanupRule(deps: TaskioDependencies) {
    const qp = window.createQuickPick<SyncQuickPickItem>();
    qp.title = "Trello Cleanup Behavior";
    qp.buttons = [QuickInputButtons.Back];
    qp.items = [
        { label: "Archive Card", value: "archive" },
        { label: "Delete Card", value: "delete" },
        { label: "Do Nothing", value: "none" }
    ];

    qp.onDidTriggerButton(async (button) => {
        if (button === QuickInputButtons.Back) {
            qp.hide();
            await SyncSettings(deps);
        }
    });

    qp.onDidAccept(() => {
        window.showInformationMessage(`Cleanup rule updated.`);
        qp.hide();
    });

    qp.show();
}