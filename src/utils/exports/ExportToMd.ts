import TaskioComment from '../../types/TaskioComment';


export default async function ExportToMd(comments: TaskioComment[]) {
  const now = new Date().toLocaleString();

  const priorityEmoji: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
    default: '⚪'
  };

  const orderNumber = { high: 0, medium: 1, low: 2, default: 4 };

  const arrayComment = Object.values(comments);

  const grouped = arrayComment.reduce((acc, task) => {
    (acc[task.priority] ??= []).push(task);
    return acc;
  }, {} as Record<string, TaskioComment[]>);

  const sortedPriorities = Object.keys(grouped).sort(
    (a, b) => orderNumber[a as keyof typeof orderNumber]
      - orderNumber[b as keyof typeof orderNumber]
  );

  let md = `# Taskio — Exported Tasks\n\n`;
  md += `_Generated at: ${now}_\n\n---\n\n`;

  for (const priority of sortedPriorities) {
    md += `## ${priorityEmoji[priority]} ${priority.toUpperCase()}\n\n`;

    for (const task of grouped[priority]) {
      md += `- [ ] **${task.displayText ?? task.text}**  \n`;
      md += `  Path: \`${task.uri.path}\`  \n`;
      md += `  Line ${task.line + 1}  \n`;
      md += `  Priority: **${priority.toUpperCase()}**\n\n`;
    }

    md += `---\n\n`;
  }

  return md;

}