import { BrowserWindow, ipcMain, dialog } from "electron";

export class Settings {

  public settings: { [key: string]: any } = {};

  constructor(private _win: BrowserWindow) {

    ipcMain.handle('open-file-dialog', async (_event, options) => {
      return dialog.showOpenDialog(this._win, options);
    });

    ipcMain.handle('update-settings', async (_event, data) => {
      Object.assign(this.settings, data);
      console.log('settings updated');
      return;
    });

    ipcMain.handle('get-settings', async (_event, _d) => {
      return this.settings;
    });

  }

  public open(fpath: string) {
    console.log(fpath);
  }

}