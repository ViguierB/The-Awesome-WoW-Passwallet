import Emitter from "../misc/emitter";

declare global {
  interface Window {
    electron: any;
  }
}

class DBService {

  private _ipc = window.electron.ipcRenderer;
  private _dbIsOpen = false

  public dbOpened = new Emitter<void>();
  public dbEdited = new Emitter<void>();

  constructor() {

    this._ipc.on('on-db-opened', (event: any) => {
      this._dbIsOpen = true;
      this.dbOpened.emit();
    })

    this._ipc.on('on-db-edited', (event: any) => {
      this.dbEdited.emit();
    })

    this._ipc.send('on-ipc-service-ready', null);

  }

  public async getDB() {
    return this._ipc.invoke('get-db') as Promise<Array<{name: string, email: string, index: number}>>;
  }

  public async addUser(name: string, email: string, password: string) {
    if (this._dbIsOpen === false) { throw new Error("DB not opened !") }
    return this._ipc.invoke('update-db', { name, email, password, command: 'add'})
  }

  public async updateUser(lastName: string, name: string, email: string, password: string) {
    if (this._dbIsOpen === false) { throw new Error("DB not opened !") }
    return this._ipc.invoke('update-db', { lastName, name, email, password, command: 'update'})
  }

  public async updateSorting(sortArray: {name: string, index: number}[]) {
    if (this._dbIsOpen === false) { throw new Error("DB not opened !") }
    return this._ipc.invoke('update-db', { sortArray, command: 'update-sorting'})
  }

  public async removeUser(name: string) {
    if (this._dbIsOpen === false) { throw new Error("DB not opened !") }
    return this._ipc.invoke('update-db', { name, command: 'remove'})
  }

}

const dbService = new DBService();
export default dbService;