declare global {
  interface Window {
    electron: any;
  }
}

class MiscService {

  private _ipc = window.electron.ipcRenderer;

  getPlatform() {
    return this._ipc.invoke('get-platform');
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

  saveFileDialog(options: any = {}) {
    return this._ipc.invoke('save-file-dialog', options).then((f: any) => {
      if (f.canceled) {
        return undefined;
      } else {
        return { file: f.filePath }
      }
    })
  }

}

const miscService = new MiscService();
export default miscService;