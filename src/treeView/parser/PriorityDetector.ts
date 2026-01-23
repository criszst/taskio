import TaskioPriority from "../../types/TaskioPriority";

function DetectPriority(suffix: string, markers: Record<TaskioPriority, string>): TaskioPriority {
  if (suffix.startsWith(markers.high)) return 'high';
  if (suffix.startsWith(markers.medium)) return 'medium';
  if (suffix.startsWith(markers.low)) return 'low';

  return 'default';
}

export default DetectPriority;