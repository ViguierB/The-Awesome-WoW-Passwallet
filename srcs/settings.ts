import { DB } from "./db";
import { BrowserWindow, ipcMain, dialog, Notification } from "electron";
import * as fs from 'fs';
import * as os from 'os';

function getDefaultPath() {
  return {
    "linux": `${os.userInfo().homedir}/.wine/c/Program Files (x86)/World of Warcraft/_classic_/WowClassic.exe`,
    "win32": "C:\\Program Files (x86)\\World of Warcraft\\_classic_\\WowClassic.exe"
  }
}

const defaultSettings = {
  wowPath: getDefaultPath(),
  dbSecretProvider: 'account-defined'
}

function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export class Settings {

  public settings: { [key: string]: any } = {};

  constructor(private _win: BrowserWindow, private _db: DB, private _filename: string) {

    ipcMain.handle('open-file-dialog', async (_event, options) => {
      return dialog.showOpenDialog(this._win, options);
    });

    ipcMain.handle('get-platform', (_event, _options) => process.platform);

    ipcMain.handle('update-settings', async (_event, data) => {
      this.settings = mergeDeep(this.settings, data);
      await this.save();
      new Notification({
        title: "PASSWALLET",
        body: "Settings have been updated!",
        silent: true,
        timeoutType: 'default'
      }).show();
      return;
    });

    ipcMain.handle('get-settings', async (_event, _d) => {
      return this.settings;
    });

  }

  save() {
    return new Promise((resolve, reject) => {
      fs.writeFile(this._filename, JSON.stringify(this.settings, null, 2), null, (err) => {
        if (!!err) { reject(err); return; }
        resolve();
      })
    });
  }

  public async open() {
    return new Promise((resolve, reject) => {
      fs.readFile(this._filename, null, async (err, buffer) => {
        if (!!err) {
          if (err.code !== 'ENOENT') { reject(err); return; }

          this.settings = defaultSettings;
          this._win.webContents.send('on-settings-opened');
          resolve();
        }

        try {
          this.settings = JSON.parse(buffer.toString());
        } catch (e) {
          reject(e);
        }

        this._win.webContents.send('on-settings-opened');
        resolve();
      });
    });
  }

}