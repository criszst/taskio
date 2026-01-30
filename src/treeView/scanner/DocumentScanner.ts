import * as vscode from 'vscode';
import TaskioComment from '../../types/TaskioComment';
import TaskioPriority from '../../types/TaskioPriority';
import CommentDetector from '../parser/CommentDetector';
import { getTaskioConfig } from '../../config/GetConfig';
import DetectPriority from '../parser/PriorityDetector';

export default function ScanDocument(document: vscode.TextDocument): TaskioComment[] {
  const { keywords, priorityMarkers }: { keywords: string[]; priorityMarkers: Record<TaskioPriority, string>; } = getTaskioConfig();
  const markers = Object.values(priorityMarkers);
  const priorityChars = [...new Set(markers.join('').split(''))];
  const priorityCharClass = priorityChars
    .map(c => `\\${c}`)
    .join('');
  

  const keywordRegex = new RegExp(`^(?:\\/\\/|#|--|/\\*|\\*)\\s*(${keywords.join('|')})([${priorityCharClass}]*)(?=\\s|:|-)`, 'gi');
  
  const results: TaskioComment[] = [];
  
  for (let line = 0; line < document.lineCount; line++) {
    const lineText = document.lineAt(line).text;
    const commentText = CommentDetector(lineText);
    
    if (!commentText) continue;
    
    keywordRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = keywordRegex.exec(commentText))) {
      const suffix = match[2] ?? '';
      const priority = DetectPriority(suffix, priorityMarkers);
      const id = `${document.uri.toString()}:${line}:${match.index}`;
      const fullText = commentText.slice(match.index);
      const baseIndex = lineText.indexOf(commentText);
      const charIndex = baseIndex + match.index;
      
      const displayText = fullText.replace(/^(?:\/\/|#|--|\/\*|\*)\s*/, '') .replace(priorityMarkers[priority], '');  
      
      results.push({
        id,
        uri: document.uri,
        line,
        character: charIndex,
        keyword: match[0],
        text: fullText,
        displayText: displayText,
        priority: priority ?? 'default',
      });
    }
  }
  
  return results;
}