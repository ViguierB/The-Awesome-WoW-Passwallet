import { app } from 'electron';

type LauncherUpdaterOptions = {
  isDev: boolean
}

type LauncherUpdater_UpdateReport = {
  aNewVersionIsAvailable: boolean,
  version: string,
  currentVersion: string
}

export default class LauncherUpdater {

  private _instance: any;

  constructor(private _options: LauncherUpdaterOptions) {
    
  }

  public launch() {
    let ctor = require('../app/outfile.asar/main').TheAwesomePasswalletMainWindow;

    this._instance = new ctor(this._options.isDev);

    this._instance.open();
  }

  public async getUpdateReport(): Promise<LauncherUpdater_UpdateReport> {
    return {
      aNewVersionIsAvailable: false,
      version: "1.0.3",
      currentVersion: "1.0.3"
    }
  }

  public anUpdateIsInstalling() {
    return false;
  }

}