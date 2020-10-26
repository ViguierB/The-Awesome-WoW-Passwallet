declare global {
  interface Window {
    electron: any;
  }
}

class ExecutorService {

  private _ipc = window.electron.ipcRenderer;

  public async launchWowForUser(username: string) {
    return this._ipc.invoke('launch-wow-for-user', username) as Promise<void>;
  }

}

const executorService = new ExecutorService();
export default executorService;