import * as vscode from 'vscode';
import TaskioComment from '../../types/TaskioComment';
import TaskioPriority from '../../types/TaskioPriority';
import CommentDetector from '../parser/CommentDetector';
import { getTaskioConfig } from '../../config/GetConfig';
import DetectPriority from '../parser/PriorityDetector';

export default function ScanDocument(document: vscode.TextDocument): TaskioComment[] {
  const { keywords, priorityMarkers }: { keywords: string[]; priorityMarkers: Record<TaskioPriority, string>; } = getTaskioConfig();

  const markers = Object.values(priorityMarkers);

  const priorityChars: string[] = [...new Set(markers.join('').split(''))];
  const priorityCharClass: string = priorityChars.map(c => `\\${c}`).join('');


  const regexString = `(?:\\{|\\/\\/|#|--|/\\*|\\*)\\s*(${keywords.join('|')})([${priorityCharClass}]*)(?=\\s|:|-)`;
  const keywordRegex = new RegExp(regexString, 'gi');


  const results: TaskioComment[] = [];

  for (let line = 0; line < document.lineCount; line++) {
    const lineText = document.lineAt(line).text;

    // Removing string literals
    // like  const string = "This is a // TODO: inside a string variable";
    const lineWithoutString = lineText.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '');

    const commentText: string | null = CommentDetector(lineWithoutString);

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

      const displayText = fullText
        .replace(/^(?:\{|\/\/|#|--|\/\*|\*)\s*/, '') // Remove start markers
        .replace(/\s*\*\/.*$/, '')                   // Remove trailing */ and anything after (like })
        .replace(/\s*$/, '')                         // Remove trailing whitespace
        .replace(priorityMarkers[priority], '')      // Remove priority marker
        .trim();

      results.push({
        id,
        uri: document.uri,
        line,
        character: charIndex,
        keyword: match[0],
        text: fullText,
        displayText: displayText,
        priority: priority ?? 'default',
        syncStatus: 'local'
      });
    }
  }

  return results;
}