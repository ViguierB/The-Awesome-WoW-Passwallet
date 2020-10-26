import { spawn } from 'child_process';
import * as path from 'path';
import { DBHandle } from './db_controller';
import { Settings } from './settings';

export abstract class Executor {

  constructor(
    private _settings: Settings,
    private _dbHandle: DBHandle
  ) {}

  protected abstract async writeInProcess(p: ReturnType<typeof spawn>): Promise<void>;

  public async start(username: string) {
    const account = this._dbHandle.getAccount(username);
    const workDir = path.dirname(this._settings.settings.wowPath);
    const wowExe = path.basename(this._settings.settings.wowPath);

    let p = spawn(wowExe, { cwd: workDir });

    this.writeInProcess(p);
  }

}

export class ExecutorForWindows extends Executor {

  protected async writeInProcess(p: ReturnType<typeof spawn>): Promise<void> {

  }

};

export class ExecutorForLinux extends Executor {

  protected async writeInProcess(p: ReturnType<typeof spawn>): Promise<void> {

  }

};

export function selectExecutor() {
  switch (process.platform) {
    case "linux": return ExecutorForLinux;
    case "win32": return ExecutorForWindows;
    default: throw new Error("Os not supported");
  }
}