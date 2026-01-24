# Taskio

Turn TODO comments into real, actionable tasks inside Visual Studio Code.

Taskio scans your codebase for comment keywords such as `TODO`, `FIXME`, and `BUG`, and displays them in a dedicated task list, helping you track pending work directly from your editor.


<div align="center">
  
![alt text](https://i.ibb.co/5gn0pPY2/todo-example-3.png)
  
</div>


---

## Features

- Automatically detects TODO-style comments
- Displays tasks in a dedicated Tree View
- Search across TODO's
- Supports task priorities using markers (`!`, `!!`, `!!!`)
- Customizable highlight behavior and colors
- Lightweight and fast

---

## Supported Keywords

By default, Taskio detects:

- `TODO`
- `FIXME`
- `BUG`

You can customize this list through the extension settings.

---

## Customization

Taskio can be configured in the VS Code settings UI or via `settings.json`.

Example configuration:

```json
{
  "taskio.keywords": ["TODO", "FIXME", "BUG"],
  "taskio.color": "#6042f5",
  "taskio.enhanceAllText": false,
  "taskio.priorityMarkers": {
    "high": "!!!",
    "medium": "!!",
    "low": "!"
  },
}
```

### Configuration Options

- **`taskio.keywords`**: Defines which comment keywords Taskio should detect as tasks.  
- **`taskio.color`**: Sets the highlight color used to mark tasks in the editor.  
- **`taskio.enhanceAllText`**: Highlights the entire comment line instead of only the keyword.
- **`taskio.priorityMarkers`**: Defines the markers used to determine task priority levels.

---

## Priority Markers

You can define task priority directly in your comments using exclamation marks:

- `!` → Low priority  
- `!!` → Medium priority  
- `!!!` → High priority  

Example:

```ts
// TODO! Refactor this function
// FIXME!! Handle edge cases
// BUG!!! This crashes on startup
```

Tasks with higher priority markers are visually distinguished in the task list and search list.

---

## Why Taskio

TODO comments are easy to write but easy to forget.

As projects grow, unfinished notes get scattered across files. Taskio turns those comments into a centralized task list inside Visual Studio Code, so you always know what still needs attention.

No external tools, no context switching — just your tasks, right next to your code.