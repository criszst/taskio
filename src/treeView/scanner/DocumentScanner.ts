import * as vscode from 'vscode';

import TaskioComment from '../../types/TaskioComment';
import TaskioPriority from '../../types/TaskioPriority';

import { isLikelyComment } from '../parser/CommentDetector';
import { getTaskioConfig } from '../../config/taskioConfig';
import DetectPriority from '../parser/PriorityDetector';

  // TODO: test for TODO tree

export default function ScanDocument(document: vscode.TextDocument): TaskioComment[] {
  const { keywords, priorityMarkers }: { keywords: string[]; priorityMarkers: Record<TaskioPriority, string>; } = getTaskioConfig();

  const markers = Object.values(priorityMarkers);

  const priorityChars = [...new Set(markers.join('').split(''))];

  const priorityCharClass = priorityChars
    .map(c => `\\${c}`)
    .join('');



  const keywordRegex = new RegExp(`(?<![A-Z0-9_])(${keywords.join('|')})([${priorityCharClass}]*)(?=\\s|:|-)`, 'gi' );

  const results: TaskioComment[] = [];

  for (let line = 0; line < document.lineCount; line++) {
    const lineText = document.lineAt(line).text;


    if (!isLikelyComment(lineText)) continue;

    keywordRegex.lastIndex = 0;

    let match: RegExpExecArray | null;

    while ((match = keywordRegex.exec(lineText))) {
      const suffix = match[2] ?? '';

      const priority = DetectPriority(suffix, priorityMarkers);

      const id = `${document.uri.toString()}:${line}:${match.index}`;
      const fullText = lineText.slice(match.index);

      results.push({
        id,
        uri: document.uri,
        line,
        character: match.index,
        keyword: match[1],
        text: fullText,
        displayText: fullText.replace(priorityMarkers[priority], ''),
        priority: priority ?? 'default',
      });
    }
  }

  return results;
}