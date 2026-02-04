import * as vscode from 'vscode';
import { TaskioDependencies } from '../types/TaskioDependencies';
import { ScanWorkspace } from '../treeView/scanner/WorkspaceScanner';

export default class EventManager {
  private disposables: vscode.Disposable[] = [];
  
    constructor() {
    this.register = this.register.bind(this);
  }

  public register(event: vscode.Disposable): void {
    this.disposables.push(event);
  }

  public dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
  }

  public registerEvent(event: vscode.Disposable): void {
    this.register(event);
  }
}