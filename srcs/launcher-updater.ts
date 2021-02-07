import axios from 'axios';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as fs from 'original-fs';
import * as path from 'path';

declare global {
  var basepath: string;
}

global.basepath = Object.freeze(path.join(app.getPath('appData'), 'the-awesome-wow-passwallet'));

const VERSIONS_SHEET_URL = "https://gitlab.holidev.net/ben/the-awesome-wow-passwallet/-/raw/docs/version.json";

type LauncherUpdaterOptions = {
  isDev: boolean
}

type LauncherUpdater_UpdateReport = {
  container: {
    aNewVersionIsAvailable: boolean,
    version: string,
    currentVersion: string,
    url: {
      linux?: string,
      win32?: string
    } | string
  },
  app: {
    aNewVersionIsAvailable: boolean,
    version: string,
    currentVersion: string,
    url: {
      linux?: string,
      win32?: string
    }
  }
}

export default class LauncherUpdater {

  private _instance: any;
  private _isInstalling: boolean = false;
  private _launchOptions: any = null;

  constructor(private _options: LauncherUpdaterOptions) {
    if (!fs.existsSync(global.basepath)) {
      fs.mkdirSync(global.basepath);
    }
    if (!fs.existsSync(path.join(global.basepath, 'app'))) {
      fs.mkdirSync(path.join(global.basepath, 'app'));
    }

    try {
      if (this._options.isDev) { return; }
      this._launchOptions = JSON.parse(fs.readFileSync(global.basepath + '/launch-settings.json').toString());
      if (!!this._launchOptions['delete']) {
        if (fs.existsSync(this._launchOptions['delete'])) {
          fs.rmdirSync(this._launchOptions['delete'], { recursive: true })
        }
      }
    } catch (_e) {
      // console.error(_e)
    }
  }

  public async launch() {
    if (!this._options.isDev && !this._launchOptions) {
      return Promise.reject('APP_NOT_INSTALLED')
    }

    try {
      let ctor = require(
        this._options.isDev
          ? '../application/dist/main'
          : path.join(this._launchOptions['package'], 'app.asar', 'main')
      ).TheAwesomePasswalletMainWindow;

      this._instance = new ctor(this._options.isDev);
    } catch(e) {
      console.error(e);
      return Promise.reject('APP_NOT_INSTALLED')
    }


    return this._instance.open();
  }

  public async restart() {
    this._isInstalling = true;
    this._instance.close();
    return this.launch().then(() => this._isInstalling = false);
  }

  public static cmpVersion(v1: string, v2: string) {
    let sv1 = v1.split('.');
    let sv2 = v2.split('.');
    let reverse = 1;

    if (sv1.length < sv2.length) {
      reverse = -1;
      const tmp = sv1;
      sv1 = sv2;
      sv2 = tmp;
    }

    for (let i = 0; i < sv1.length; ++i) {
      const val = Number.parseInt(sv1[i]) - Number.parseInt(sv2[i] || "0");
      if (val !== 0) {
        return val * reverse;
      }
    }

    return 0;
  }

  private async _requestVersionsSheet() {
    const response = await axios.get(VERSIONS_SHEET_URL);

    if (response.status === 200) {
      let versionSheet = response.data;

      return versionSheet;
    } else {
      throw response;
    }
  }

  public async getUpdateReport(): Promise<LauncherUpdater_UpdateReport> {

    let versionSheet = await this._requestVersionsSheet();

    const currentVersion = {
      'app': this._instance?.getVersion(),
      'container': this._getVersion()
    };

    Object.keys(versionSheet).forEach(key => {
      versionSheet[key]['currentVersion'] = (<any>currentVersion)[key];

      versionSheet[key]['aNewVersionIsAvailable'] = LauncherUpdater.cmpVersion(
        versionSheet[key]['version'],
        versionSheet[key]['currentVersion'],
      ) > 0
    })

    return versionSheet;

  }

  public async processFirstInstall(progress: (message: string) => void) {
    progress('Getting informations about the current version online...');
    let versionSheet = await this._requestVersionsSheet();
    progress('Downloading...')
    await this.downloadNewAppUpdate(versionSheet['app']);
    progress('Installing...')
    await this.applyPendingUpdate();
  }

  private _getVersion() {
    if (this._options.isDev === true) {
      return "1.0.0"
    } else {
      return require('../package.json')?.version
    }
  }

  public async askForContainerUpdade(updateReport: LauncherUpdater_UpdateReport['container']) {
    const { response } = await dialog.showMessageBox(this._instance.getWindow(), {
      title: "A new version is available",
      buttons: ['yes', 'no'],
      type: 'question',
      message: 'A new container version is available' +
       ` (${updateReport.version} over ${updateReport.currentVersion})\n` +
       'Install it ?'
    });

    if (response === 0) {
      return true;
    } else {
      return false;
    }
  }

  public async askInstanceForApplyAppUpdate({ currentVersion, version }: LauncherUpdater_UpdateReport["app"]) {
    let win = this._instance.getWindow() as BrowserWindow;

    win.webContents.send('update-ready-install-request', { currentVersion, version });
    return new Promise((resolve) => {
      ipcMain.once('update-ready-install-response', (_e, res: boolean) => {
        resolve(res);
      });
    })
    
  }

  public async downloadNewAppUpdate(updateReport: LauncherUpdater_UpdateReport["app"]) {
    if (this._options.isDev) {
      return false;
    }
    const p = path.join(global.basepath, 'app', updateReport.version);
    const previousp = path.join(global.basepath, 'app', updateReport.currentVersion || 'null');
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
    }
    if (![ 'linux', "win32" ].find(os => os === process.platform)) {
      throw new Error("Unsupported Platform");
    }
    const writer = fs.createWriteStream(path.join(p, 'app'));
    return axios({
      method: 'get',
      url: updateReport.url[process.platform as "linux" | "win32"],
      // onDownloadProgress: (progress) => {
      //   console.log(progress);
      // },
      responseType: 'stream',
    }).then(response => {
      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let error: any = null;
        writer.on('error', err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on('close', () => {
          if (!error) {
            resolve(true);
          }
        });
      });
    }, (e) => {
      console.error(e)
      return false;
    }).then((r) => {
      if (r) {
        fs.renameSync(path.join(p, 'app'), path.join(p, 'app.asar'));
        this._launchOptions = { 'package': p }
        if (!!updateReport.currentVersion) {
          this._launchOptions['delete'] = previousp;
        }
        fs.writeFileSync(global.basepath + '/launch-settings.json', JSON.stringify(this._launchOptions));
      }
      return r;
    })
  }

  public async applyPendingUpdate() {
    this._isInstalling = true;
    this._instance?.close();
    await this.launch();
    this._isInstalling = false;
  }

  public anUpdateIsInstalling() {
    return this._isInstalling;
  }

}