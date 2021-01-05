import { DB } from "./db";
import { BrowserWindow, ipcMain, dialog } from "electron";
import * as fs from 'fs';
import * as os from 'os';
import DBControllerKeytar, { controllerType as controllerKeytarType } from './db_controller_keytar';
import DBControllerUserPassword, { controllerType as controllerUserPasswordType } from './db_controller_user_password';
import { mergeDeep } from "./misc";

function getDefaultPath() {
  return {
    "linux": {
      path: `${os.userInfo().homedir}/.wine/c/Program Files (x86)/World of Warcraft`,
    },
    "win32": {
      path: "C:\\Program Files (x86)\\World of Warcraft"
    }
  }
}

const defaultSettings = {
  wow: getDefaultPath(),
  selectedExtension: 'retail',
  dbSecretProvider: controllerKeytarType
}

export class Settings {

  public settings: { [key: string]: any } = {};

  constructor(private _win: BrowserWindow, private _db: DB, private _filename: string) {

    ipcMain.handle('get-platform', (_event, _options) => process.platform);

    ipcMain.handle('set-provider-keytar', (_event, _void) => {
      if (this.settings.dbSecretProvider === controllerKeytarType) {
        return;
      }

      this.settings.dbSecretProvider = controllerKeytarType;
      this._db.changeController(DBControllerKeytar);
      this._win.webContents.send('show-toast', {
        title: 'Settings',
        message: 'Settings have been updated'
      });
    });

    ipcMain.handle('set-provider-password', (_event, password) => {
      this.settings.dbSecretProvider = controllerUserPasswordType;
      this._db.changeController(DBControllerUserPassword);
      (<DBControllerUserPassword>this._db.getController()).setPassword(password);
      this._win.webContents.send('show-toast', {
        title: 'Settings',
        message: 'Password updated'
      });
    });

    ipcMain.handle('update-settings', async (_event, { data, notif = true }) => {
      this.settings = mergeDeep(this.settings, data);
      await this.save();
      if (notif) {
        this._win.webContents.send('show-toast', {
          title: 'Settings',
          message: 'Settings have been updated!'
        });
      }
      return;
    });

    ipcMain.handle('get-settings', async (_event, _d) => {
      return this.settings;
    });

    this._win.on('close', () => {
      this.settings.bounds = this._win.getBounds();
    });

  }

  save() {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(this._filename, JSON.stringify(this.settings, null, 2), null, (err) => {
        if (!!err) { reject(err); return; }
        resolve();
      })
    });
  }

  public async open() {
    return new Promise<void>((resolve, reject) => {
      fs.readFile(this._filename, null, async (err, buffer) => {
        if (!!err) {
          if (err.code !== 'ENOENT') { reject(err); return; }

          this.settings = defaultSettings;
          this._win.webContents.send('on-settings-opened');
          resolve();
        }

        try {
          this.settings = JSON.parse(buffer.toString());

          // fix settings format
          if (!!this.settings.wowPath) {
            this.settings.wow = {};
            Object.keys(this.settings.wowPath).forEach(k => {
              let v = this.settings.wowPath[k];

              this.settings.wow[k] = { path: v };
            })
            delete this.settings.wowPath;
          }

          this.settings = mergeDeep(defaultSettings, this.settings)

        } catch (e) {
          reject(e);
        }

        if (!!this.settings.bounds) {
          this._win.setBounds(this.settings.bounds);
        }

        this._win.webContents.send('on-settings-opened');
        resolve();
      });
    });
  }

}