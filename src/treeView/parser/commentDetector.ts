export function isLikelyComment(line: string): boolean {
  const trimmed: string = line.trim()
  
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('--') ||
    trimmed.startsWith('%')
  ) return true
  

  if (
    line.includes('//') ||
    line.includes('#') ||
    line.includes('/*') ||
    line.includes('*') ||
    line.includes('--') ||
    line.includes('%')
  ) return true
  
  return false
}