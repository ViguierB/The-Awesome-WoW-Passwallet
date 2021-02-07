import { spawn } from 'child_process';
import * as path from 'path';
import { DBHandle } from './db_controller';
import { Settings } from './settings';
const { NativeExecutor } = require('./native_executor.node');

const pTimeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

export class Executor {

  constructor(
    private _settings: Settings,
    private _dbHandle: DBHandle
  ) {}

  private _getFullPath() {
    const pathSuffixs = {
      'retail': [ '_retail_', 'Wow.exe' ],
      'classic': [ '_classic_', 'WowClassic.exe' ]
    };
    const suffix = pathSuffixs[this._settings.settings['selectedExtension'] as 'retail' | 'classic'];

    return path.join(
      this._settings.settings.wow[process.platform].path,
      ...suffix
    );
  }

  public async start(username: string) {
    const nativeExecutor = new NativeExecutor()
    nativeExecutor.setAccount(this._dbHandle.getAccount(username));
    nativeExecutor.setWorkDir(path.dirname(this._getFullPath()));
    nativeExecutor.setWowName(path.basename(this._getFullPath()));
    if (!!this._settings.settings.wow[process.platform].env) {
      nativeExecutor.setWowEnv(this._settings.settings.wow[process.platform].env);
    }
    if (!!this._settings.settings.wow[process.platform].args) {
      nativeExecutor.setWowArgs(this._settings.settings.wow[process.platform].args);
    }

    nativeExecutor.spawnWow();
    try {
      await (async () => {
        let wowReady = false;
        for (let i = 0; i < 30; ++i) {
          await pTimeout(500);
          wowReady = nativeExecutor.isWoWReady();
          if (wowReady) { return; }
        }
        throw new Error('Window handler not found');
      })();
      await pTimeout(nativeExecutor.getWaitingTime());
      nativeExecutor.writeCredentials();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

}