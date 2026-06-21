# Taskio

Turn TODO, FIXME and BUG comments into an organized task board inside VS Code.

Taskio helps you spot code comments that deserve attention, keep them grouped in one place, and act on them without leaving the editor.

<div align="center">

  <p align="center">
    <img src="https://raw.githubusercontent.com/criszst/taskio/master/assets/mk.gif" width="900" alt="Taskio demo animation" />
  </p>

</div>

---

## Why Taskio?

Code comments are where a lot of technical debt quietly hides.

Taskio turns those comments into a visible workflow so you can find pending work faster, prioritize what matters, and keep your workspace clean.

If you already leave TODOs in your codebase, Taskio gives them a home.

<div align="center">
  <img width="1205" height="346" src="https://raw.githubusercontent.com/criszst/taskio/master/assets/demonstration.png" alt="Taskio tree view screenshot" />
</div>

---

## Marketplace Description

Taskio is a lightweight task board for VS Code that turns `TODO`, `FIXME` and `BUG` comments into actionable work.

Instead of letting technical debt disappear inside source files, Taskio keeps those comments visible in a dedicated Tree View, where they can be searched, grouped, prioritized and exported in just a few clicks.

It is designed for developers who already use code comments to mark future work and want a cleaner, faster way to track what still needs attention without switching tools.

Taskio supports priority markers like `!`, `!!` and `!!!`, custom keywords, highlight colors, task export to JSON, Markdown or TXT, and optional Trello integration for teams that want a more connected workflow.

No setup is required for the core workflow. Install Taskio and start organizing the comments already living in your codebase.

---

## What It Does

- Detects `TODO`, `FIXME` and `BUG` comments automatically
- Shows all tasks in a dedicated Tree View
- Lets you search tasks quickly across the workspace
- Supports priority markers with `!`, `!!` and `!!!`
- Groups tasks by priority, file or folder
- Exports tasks to JSON, Markdown or TXT
- Lets you customize keywords and highlight color
- Includes optional Trello integration for syncing tasks

---

## Best For

- Developers who want to keep track of TODOs without switching tools
- Teams that use comments to mark technical debt
- People who want a simple, lightweight task list based on code comments

---

## Screenshots Order

Use the images in this order in the README and Marketplace gallery:

1. `Overview` - show the Taskio Tree View with several tasks already discovered.
   - Caption: `Turn code comments into a visible task board.`
2. `Priority` - show `!`, `!!` and `!!!` in the code and in the task list.
   - Caption: `See what needs attention first.`
3. `Search` - show the search command filtering tasks across the workspace.
   - Caption: `Find tasks fast across the whole project.`
4. `Grouping` - show tasks organized by priority, file or folder.
   - Caption: `Keep technical debt organized your way.`
5. `Trello` - show a task being sent or synced with Trello.
   - Caption: `Move tasks into your existing workflow.`

---

## Commands

Taskio adds the following commands to VS Code:

- `Taskio: Search Tasks...`
- `Taskio: Refresh`
- `Taskio: Change Grouping Mode`
- `Taskio: Export Tasks`
- `Taskio: Copy Comment`
- `Taskio: Remove Task`
- `Taskio.Trello: Configure Trello Connection`
- `Taskio.Trello: Manage Trello Integration`
- `Taskio.Trello: Send to Trello`
- `Taskio.Trello: Open in Trello`

---

## Supported Keywords

By default, Taskio detects:

- `TODO`
- `FIXME`
- `BUG`

You can fully customize this list in the extension settings.

---

## Priority Markers

You can define task priority directly in your comments using exclamation marks:

- `!` -> Low priority
- `!!` -> Medium priority
- `!!!` -> High priority

### Example

```ts
// TODO! Refactor this function
// FIXME!! Handle edge cases
// BUG!!! Crashes on startup
```

Higher priority tasks are visually distinguished in the tree view and search results.

---

## Task Examples

```ts
// TODO! improve error handling
// FIXME!! fix payment retry bug
// BUG!!! login crashes on expired token
```

Taskio keeps those comments visible, searchable and easy to organize.

---

## Customization

Taskio can be configured via the VS Code Settings UI or directly in `settings.json`.

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

---

## Exporting Tasks

Taskio supports exporting tasks for documentation or reporting:

- JSON for integrations and tooling
- Markdown for README files and reports
- TXT for a quick plain-text export

Exported tasks include file path, line number, priority and clean descriptions.

---

## Trello Integration

Taskio includes optional Trello support so you can send tasks to a board and keep them synced with your workflow.

Use the built-in Trello commands to configure the integration, manage the connection, open synced cards and send comments to Trello.

---

## Install

Install Taskio from the VS Code Marketplace and start writing TODOs in your codebase.

No setup is required for the core workflow.

---

## Feedback

If Taskio helps you stay productive, consider leaving a review on the VS Code Marketplace. It really helps the project grow.
