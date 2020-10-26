import { DB } from "./db";
import { BrowserWindow, ipcMain, dialog, Notification } from "electron";
import * as fs from 'fs';
import * as os from 'os';

function getDefaultPath() {
  switch (process.platform) {
    case "linux": return `${os.userInfo().homedir}/.wine/c/Program Files (x86)/World of Warcraft/_classic_/WowClassic.exe`
    case "win32": return "C:\\Program Files (x86)\\World of Warcraft\\_classic_\\WowClassic.exe"
    default: return ''
  }
}

const defaultSettings = {
  wowPath: getDefaultPath(),
  dbSecretProvider: 'account-defined'
}

export class Settings {

  public settings: { [key: string]: any } = {};

  constructor(private _win: BrowserWindow, private _db: DB, private _filename: string) {

    ipcMain.handle('open-file-dialog', async (_event, options) => {
      return dialog.showOpenDialog(this._win, options);
    });

    ipcMain.handle('update-settings', async (_event, data) => {
      Object.assign(this.settings, data);
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