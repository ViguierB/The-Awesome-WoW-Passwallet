import Emitter from '../misc/emitter';

declare global {
  interface Window {
    electron: any;
  }
}

class SettingsService {

  private _ipc = window.electron.ipcRenderer;

  public settingUpdated = new Emitter<void>();

  updateSettings(data: { [key: string]: any }, notif = true ) {
    return this._ipc.invoke('update-settings', { data, notif }).then(() => this.settingUpdated.emit());
  }

  getSettings() {
    return this._ipc.invoke('get-settings');
  }

  setProviderPassword(password: string) {
    return this._ipc.invoke('set-provider-password', password);
  }

  setProviderKeytar() {
    return this._ipc.invoke('set-provider-keytar');
  }

}

const settingsService = new SettingsService();
export default settingsService;