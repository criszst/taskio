# Change Log

All notable changes to the "taskio" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.6] - 2026-06-21

### Added
- Stable local IDs for TODOs, separated from parser-derived IDs
- Explicit sync states: `never_synced`, `synced`, `modified`, `syncing`, and `error`
- A shared reconcile engine for manual sync, auto-sync, and sync-on-startup
- Remote card reuse/update logic to avoid duplicate Trello cards when a TODO changes text
- Fallback lookup for remote cards using `LocalId` and Taskio metadata
- Debounced document rescans to reduce churn while editing

### Changed
- Manual "Send to Trello" now uses the same reconcile path as automatic sync
- Sync confirmation only reports success when a real sync happened
- Priority is now sent with both new cards and updates so the Trello label stays in sync
- Taskio metadata stored in Trello descriptions was reduced to the minimum needed for reconciliation
- Tree view rendering now reflects sync state more accurately instead of falling back to a generic marker
- Document reconciliation is more conservative to prevent state leakage between nearby TODOs

### Fixed
- Auto-sync not consistently running on the configured interval
- Sync-on-startup skipping the reconcile path in some cases
- Duplicate Trello cards being created after editing an already synced TODO
- Neighboring TODOs losing sync or priority state after inserting or editing a nearby TODO
- "Task sent to Trello!" appearing after cancelling the confirmation dialog
- Progress notifications appearing for cancelled or no-op sync attempts
- Trello cards sometimes losing their priority label during updates

### Improved
- Better persistence of sync state across workspace rescans and reloads
- Stronger protection against accidental cross-item state reuse in the tree view
- Cleaner Trello payloads with less redundant metadata
- Better debugging signals for sync scheduling and reconcile failures

---

## [0.1.5] - 2026-03-18

### Added
- Almost Full Trello integration management via `ManageIntegration` command
- Options to:
  - Change Board and List dynamically
  - Sync all unsynced tasks to Trello
  - Desync all synced tasks from Trello (including card deletion)
  - Open current Trello board in browser
  - Disconnect Trello integration
- Centralized SyncService for handling sync/desync operations

### Improved
- Refactored Trello integration flow for better modularity and scalability
- Improved Quick Pick UX for integration management
- Better separation of concerns between services (TrelloService, SyncService)

### Fixed
- Inconsistencies between local task state and Trello sync status
- Edge cases where tasks remained marked as synced after deletion

---

## [0.1.4] - 2026-02-26

### Added
- Initial Trello integration
- Secure storage of Trello credentials using SecretStorage
- Board and List selection during setup
- Sync individual tasks to Trello
- Persistent workspace configuration for:
  - Board ID
  - Board Name
  - List ID
  - List Name

### Improved
- Internal architecture prepared for external integrations (Trello-first approach)
- Task model extended with `syncStatus`

---

## [0.1.3] - 2026-02-13

### Added
- Refactored TreeView architecture to prevent infinite refresh loop
- Dynamic title update when switching between List, Files, Folders, and Tree modes
- Added Remove Command and Refresh Command

## [0.1.2] - 2026-04-02

## Fixed
- Some files (after renaming them) did not appear in the initial scan.
- File extensions such as `.c`, `.h`, `.hpp`, `.cc` did not appear in the matching workspace pattern.

---

## [0.1.1] - 2026-03-02

### Added
- Export tasks to JSON
- Export tasks to Markdown

### Improved
- Task ordering by priority (high -> low)
- Cleaner exported task descriptions

---

## [0.1.0] - 2026-02-02

### Added
- Due date support in tasks
- Overdue task visual highlight
- Quick Code Actions (mark as done, copy, reveal)

### Improved
- Task parsing robustness
- Tree View performance

---

## [0.0.9] - 2026-01-30

### Added
- Task grouping by folder and file
- Priority-based sorting option

### Improved
- Internal data model for tasks

---

## 0.0.8 - 2026-01-26
- Updated README demo (media optimization)


## [0.0.7] - 2026-01-26

### Added
- Publicly accessible repository for the Taskio extension, containing the source code and build process.

---

## [0.0.6] - 2026-01-26

### Improved
- Improved Search action placement in the Taskio Tree View for better discoverability

---

## [0.0.5] - 2026-01-25

### Added
- Smart Copy command for tasks:
  - Copy description only (without keyword and priority markers)
  - Copy full comment text
  - Copy file name and line number
- Priority emojis displayed in the Search / Quick Pick list
- Context menu action to copy tasks directly from the Tree View

### Improved
- Internal command structure for future copy-related features

### Fixed
- Issue where Copy command received an undefined comment
- Incorrect task text being copied in some edge cases
- Minor UX inconsistencies in task selection

---

## [0.0.4] - 2026-01-24

### Added
- Copy action to copy only the task description (without keyword)
- Improved keyword parsing to extract clean descriptions

---

## [0.0.3] - 2026-01-24

### Added
- Priority markers support using `!`, `!!` and `!!!`
- Custom priority configuration via `taskio.priorityMarkers`
- Search command to quickly find TODO comments
- Tree View integration in the Activity Bar

### Improved
- Performance when scanning large workspaces
- Highlight rendering consistency
- General UX improvements in the Taskio view

### Fixed
- Edge cases where comments were not detected correctly

---

## [0.0.2] - 2026-01-24

### Added
- Configurable TODO keywords (`taskio.keywords`)
- Custom highlight color option
- Option to enhance full comment text

### Improved
- Task detection accuracy

---

## [0.0.1] - 2026-01-24

### Added
- Initial release
- Detection of TODO, FIXME and BUG comments
- Basic Tree View displaying tasks
