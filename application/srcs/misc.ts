import { ipcMain, dialog, BrowserWindow } from "electron";

export default class Misc {
  constructor(private _win: BrowserWindow) {
    ipcMain.handle('open-file-dialog', async (_event, options) => {
      return dialog.showOpenDialog(this._win, options);
    });

    ipcMain.handle('save-file-dialog', async (_event, options) => {
      return dialog.showSaveDialog(this._win, options);
    });
  }
}

function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target: any, ...sources: any[]): any {
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