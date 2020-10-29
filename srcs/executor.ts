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
    this.nativeExecutor.setWorkDir(path.dirname(this._settings.settings.wowPath));
    this.nativeExecutor.setWowName(path.basename(this._settings.settings.wowPath));

    this.nativeExecutor.spawnWow();
    try {
      console.log('test 1');
      await this.nativeExecutor.waitForWoWReady();
      console.log('test 2 ??');
    } catch (e) {
      console.log(e);
    }
  }

}