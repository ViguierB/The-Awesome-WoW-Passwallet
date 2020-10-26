import { spawn } from 'child_process';
import * as path from 'path';
import { DBHandle } from './db_controller';
import { Settings } from './settings';

const pTimeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

export abstract class Executor {

  protected _account: { email: string, password: string }

  constructor(
    private _settings: Settings,
    private _dbHandle: DBHandle
  ) {
    this._account = null as any;
  }

  protected abstract async writeInProcess(p: ReturnType<typeof spawn>): Promise<void>;
  protected abstract spawn(wowExe: string, workDir: string): ReturnType<typeof spawn>;

  public async start(username: string) {
    const account = this._dbHandle.getAccount(username);
    const workDir = path.dirname(this._settings.settings.wowPath);
    const wowExe = path.basename(this._settings.settings.wowPath);

    let p = this.spawn(wowExe, workDir);

    this._account = account;

    await this.writeInProcess(p);
  }

}

export class ExecutorForWindows extends Executor {

  protected async writeInProcess(p: ReturnType<typeof spawn>): Promise<void> {
    
  }

  protected spawn(wowExe: string, workDir: string) {
    return spawn(wowExe, { cwd: workDir });
  }

};

export class ExecutorForLinux extends Executor {

  protected async writeInProcess(p: ReturnType<typeof spawn>): Promise<void> {
    p.stdout?.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    p.stderr?.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    await pTimeout(3000);
  }

  protected spawn(wowExe: string, workDir: string) {
    return spawn('wine', [ `./${wowExe}` ], { cwd: workDir });
  }

};

export function selectExecutor() {
  switch (process.platform) {
    case "linux": return ExecutorForLinux;
    case "win32": return ExecutorForWindows;
    default: throw new Error("Os not supported");
  }
}