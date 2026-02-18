/**
 * Detects comments in a line of text.
 * Returns the comment text if a comment is found, or null otherwise.
 * Supports normal comments (//), Python/Shell comments (#), SQL comments (--), and block comments (/* or *).
 * @param {string} line - The line of text to search for a comment.
 * @returns {string|null} The comment text if a comment is found, or null otherwise.
 */

function CommentDetector(line: string): string | null {
  const trimmed = line.trim();

  // Normal Comments
  const lineComment = line.indexOf('//');
  if (lineComment !== -1) {
    
    // https urls
    if (!line.slice(0, lineComment).includes('http')) {
      return line.slice(lineComment);
    }
  }

  // To react files like jsx/tsx
 if (trimmed.includes('/*')) {
    const startIndex = line.indexOf('/*');
    return line.slice(startIndex); 
  }

  // Python, Shell
  const hashComment = 
      trimmed.startsWith('#') 
      ? trimmed : line.includes('#')
      ? line.slice(line.indexOf('#')) : null;

  if (hashComment) return hashComment;

  // SQL
  const sqlComment = line.indexOf('--');
  if (sqlComment !== -1) {
    return line.slice(sqlComment);
  }

  // Block comments
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return trimmed;
  }

  // HTML comments (a type of)
  if (line.endsWith('-->')) {
    const hasComment = line.replace('-->', '').trim();

    return hasComment;
  }

  return null;
}

export default CommentDetector;