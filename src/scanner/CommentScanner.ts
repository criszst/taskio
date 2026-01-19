import * as vscode from 'vscode';

import TaskioComment from '../types/TaskioComment';
import { isLikelyComment } from '../parser/commentDetector';
import { getTaskioConfig } from '../config/taskioConfig';

export default function ScanDocument(document: vscode.TextDocument): TaskioComment[] {
  const { keywords }: { keywords: string[]; } = getTaskioConfig();
  
  // TODO: Optimize regex creation with config changes tracking about enhanceAllText and keywords only
  const keywordRegex = new RegExp(
    `(?<![A-Z0-9_])(${keywords.join('|')})(?=\\s*[:\\-])`,
    'gi'
  )

  const results: TaskioComment[] = [];

  for (let line = 0; line < document.lineCount; line++) {
    const lineText = document.lineAt(line).text;

    if (!isLikelyComment(lineText)) continue;

    let match: RegExpExecArray | null;

    while ((match = keywordRegex.exec(lineText))) {
      const id = `${document.uri.toString()}:${line}:${match.index}`;

      results.push({
        id,
        uri: document.uri,
        line,
        character: match.index,
        keyword: match[1],
        text: lineText.trim(),
      });
    }
  }

  return results;
}