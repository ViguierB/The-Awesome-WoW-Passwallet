import { spawn } from 'child_process';
import * as path from 'path';
import { DBHandle } from './db_controller';
import { Settings } from './settings';
const { NativeExecutor } = require('bindings')('native_executor')

const pTimeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

export class Executor {

  nativeExecutor = new NativeExecutor()

  constructor(
    private _settings: Settings,
    private _dbHandle: DBHandle
  ) {}

  public async start(username: string) {
    this.nativeExecutor.setAccount(this._dbHandle.getAccount(username));
    this.nativeExecutor.setWorkDir(path.dirname(this._settings.settings.wowPath[process.platform]));
    this.nativeExecutor.setWowName(path.basename(this._settings.settings.wowPath[process.platform]));

    this.nativeExecutor.spawnWow();
    try {
      await this.nativeExecutor.waitForWoWReady();
      this.nativeExecutor.writeCredentials();
    } catch (e) {
      console.log(e);
    }
  }

}