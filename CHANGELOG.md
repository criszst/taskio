# Change Log

All notable changes to the "taskio" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

---
## [0.1.2] - 2026.04.02

## Fixed
- Some files (after renaming them) did not appear in the initial scan.
- File extensions such as `.c`, `.h`, `.hpp`, `.cc` did not appear in the matching workspace pattern.

---

## [0.1.1] – 2026.03.02

### Added
- Export tasks to JSON
- Export tasks to Markdown

### Improved
- Task ordering by priority (high → low)
- Cleaner exported task descriptions

---

## [0.1.0] – 2026.02.02

### Added
- Due date support in tasks
- Overdue task visual highlight
- Quick Code Actions (mark as done, copy, reveal)

### Improved
- Task parsing robustness
- Tree View performance

---

## [0.0.9] – 2026.01.30

### Added
- Task grouping by folder and file
- Priority-based sorting option

### Improved
- Internal data model for tasks

---

## 0.0.8 - 2026.01.26
- Updated README demo (media optimization)


## [0.0.7] - 2026.01.26

### Added
- Publicly accessible repository for the Taskio extension, containing the source code and build process.

---

## [0.0.6] – 2026.01.26

### Improved
- Improved Search action placement in the Taskio Tree View for better discoverability

---

## [0.0.5] – 2026.01.25

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

## [0.0.4] – 2026.01.24

### Added
- Copy action to copy only the task description (without keyword)
- Improved keyword parsing to extract clean descriptions

---

## [0.0.3] – 2026.01.24

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

## [0.0.2] – 2026.01.24

### Added
- Configurable TODO keywords (`taskio.keywords`)
- Custom highlight color option
- Option to enhance full comment text

### Improved
- Task detection accuracy

---

## [0.0.1] – 2026.01.24

### Added
- Initial release
- Detection of TODO, FIXME and BUG comments
- Basic Tree View displaying tasks
