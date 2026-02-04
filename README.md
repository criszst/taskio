# Taskio - TODO List

Turn TODO, FIXME and BUG comments into real, actionable tasks inside Visual Studio Code.

Taskio scans your codebase for TODO-style comments and transforms them into a centralized task list, helping developers track pending work without leaving the editor.

<div align="center">

![Taskio TODO Example](https://github.com/criszst/taskio/blob/master/media/TaskVideo-Example(5)(2).gif?raw=true)

</div>

---

## Features

- Automatically detects TODO, FIXME and BUG comments
- Displays all tasks in a dedicated Tree View
- Fast search across tasks
- Task priorities using markers (!, !!, !!!)
- Priority-based task ordering (high → low)
- Export tasks to JSON and Markdown
- Customizable highlight colors and behavior
- Lightweight and fast (no performance impact)

---

## How It Works

Taskio continuously scans your workspace for comment keywords and keeps them organized in a task tree.

No setup required — install and start writing TODOs.

---

## Tree View Actions

The Taskio Tree View provides quick actions via built-in VS Code icons:

- $(search) Search  
  Quickly search tasks across the workspace.

- $(list-unordered) Organize  
  Organize tasks by priority, file or folder.

- $(export) Export  
  Export tasks to JSON or Markdown.

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

- JSON export for integrations and tooling
- Markdown export for README files and reports

Exported tasks include file path, line number, priority and clean descriptions.

### ⭐ Enjoying Taskio?
If Taskio helps you stay productive, consider leaving a ⭐ review on the VS Code Marketplace — it really helps!
