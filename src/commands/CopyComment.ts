import * as vscode from 'vscode';


import { CommentNode } from '../treeView/TreeNode';
import { getTaskioConfig } from '../config/GetConfig';


export default async function CopyComment(commentNode: CommentNode) {
  const { keywords }: { keywords: string[]; } = getTaskioConfig();

  const keywordRegex = new RegExp(`^\\s*(?:\\/\\/+|\\/\\*+|\\*+|#|<!--)?\\s*(${keywords.join('|')})\\b[!\\s\\-:]*\\s*`, 'i');

  const label = commentNode.label as string;
  const displayLabel = keywordRegex.test(label) ? label.replace(keywordRegex, '') : label;

  const options = [
    {
      label: 'Copy description',
      value: 'description'
    },
    {
      label: 'Copy full comment',
      value: 'full'
    },
    {
      label: 'Copy file location',
      value: 'location'
    }
  ];

  const pickedOption = await vscode.window.showQuickPick(options, {
    placeHolder: 'What do you want to copy?'
  });

  if (!pickedOption) return;

  let textToCopy = '';

  switch (pickedOption.value) {
    case 'description':
      textToCopy = displayLabel;
      break;

    case 'full':
      textToCopy = label;
      break;

    case 'location':
      textToCopy = `${commentNode.resourceUri}`;
      break;
  }

  await vscode.env.clipboard.writeText(textToCopy);

  await vscode.window.showInformationMessage('Taskio: Comment copied!');
}
