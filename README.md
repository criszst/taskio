# Taskio - TODO List

Turn TODO, FIXME and BUG comments into real, actionable tasks inside Visual Studio Code.

Taskio scans your codebase for TODO-style comments and transforms them into a centralized task list, helping developers track pending work without leaving the editor.

<div align="center">

https://github.com/user-attachments/assets/e061bb14-9a16-4d05-b854-9f49bc164f8a

</div>

---

## How It Works

Taskio continuously scans your workspace for comment keywords and keeps them organized in a task tree.

No setup required — install and start writing TODOs.

<img width="1205" height="346" alt="image" src="https://github.com/user-attachments/assets/fc3c59ee-4ee2-4c12-9dc4-58e6a55d1240" />




---

## Features

- Automatically detects TODO, FIXME and BUG comments
- Displays all tasks in a dedicated Tree View
- Fast search across tasks
- Task priorities using markers (!, !!, !!!)
- Priority-based task ordering (high → low)
- Export tasks JSON, Markdown or TXT
- Customizable highlight colors and behavior
- Lightweight and fast (no performance impact)

---

## Tree View Actions

The Taskio Tree View provides quick actions via built-in VS Code icons:

- Search quickly tasks across the workspace.

- Refresh all Tree View

- Organize tasks by priority, file or folder.

- Export tasks JSON, Markdown or TXT

- Trello Configurations can manage Trello Integration which can change Board/List integrate, synchronize all tasks and so on.

---

## Supported Keywords

By default, Taskio detects the following keywords:

- TODO
- FIXME
- BUG

You can fully customize this list in the extension settings.

---

## Customization

Taskio can be configured via the VS Code Settings UI or directly in settings.json.

### Example configuration

```json
{
  "taskio.keywords": ["TODO", "FIXME", "BUG"],
  "taskio.color": "#6042f5",
  "taskio.enhanceAllText": false,
  "taskio.priorityMarkers": {
    "high": "!!!",
    "medium": "!!",
    "low": "!"
  }
}
```

## Priority Markers

You can define task priority directly in your comments using exclamation marks:

- `!` → Low priority  
- `!!` → Medium priority  
- `!!!` → High priority  

### Example

```ts
// TODO! Refactor this function
// FIXME!! Handle edge cases
// BUG!!! Crashes on startup
```

Higher priority tasks are visually distinguished in the task tree and search results.

---

## Exporting Tasks

Taskio supports exporting tasks for documentation or reporting:

- JSON export for integrations and tooling;
- Markdown (MD) export for README files and reports;
- TXT export just because yes.

Exported tasks include file path, line number, priority and clean descriptions.

### ⭐ Enjoying Taskio?
If Taskio helps you stay productive, consider leaving a ⭐ review on the VS Code Marketplace — it really helps!
