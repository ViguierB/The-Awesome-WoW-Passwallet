import Emitter from '../misc/emitter';

declare global {
  interface Window {
    electron: any;
  }
}

class SettingsService {

  private _ipc = window.electron.ipcRenderer;

  public settingUpdated = new Emitter<void>();


  // constructor() {

  //   // this._ipc.on('on-settings-opened', (_e: any) => {
  //   //   this.settingUpdated.emit();
  //   // });

  // }

  getPlatform() {
    return this._ipc.invoke('get-platform');
  }

  updateSettings(data: { [key: string]: any } ) {
    return this._ipc.invoke('update-settings', data).then(() => this.settingUpdated.emit());
  }

  getSettings() {
    return this._ipc.invoke('get-settings');
  }

  openFileDialog(options: any = {}) {
    return this._ipc.invoke('open-file-dialog', options).then((f: any) => {
      if (f.canceled) {
        return undefined;
      } else if (f.filePaths.length > 1) {
        return { files: f.filePaths }
      } else {
        return { file: f.filePaths[0] }
      }
    }) as Promise<{
      files: Array<string> | undefined,
      file: string | undefined
    }>;
  }

}

const settingsService = new SettingsService();
export default settingsService;