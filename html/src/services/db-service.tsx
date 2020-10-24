import gen from '../misc/very-simple-key-generator'

declare global {
  interface Window {
    electron: any;
  }
}

class Emitter<T> {
  private _handlers: any[] = [];

  subcribe(func: (handle: { unsubscribe: () => void }, arg: T) => void) {
    const id = gen.get();
    const handle = {
      unsubscribe: () => {
        let idx = this._handlers.findIndex(el => el.id === id);

        if (idx >= 0) {
          this._handlers.splice(idx, 1);
        }
      }
    };
    let elem = {
      id, func: (arg1: T) => func(handle, arg1)
    }
    this._handlers.push(elem);
    return {
      unsubscribe: handle.unsubscribe
    }
  }

  emit(arg: T) {
    this._handlers.forEach(e => {
      e.func(arg);
    });
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
    return this._ipc.invoke('get-db') as Promise<Array<{name: string, email: string}>>;
  }


  public async addUser(name: string, email: string, password: string) {
    if (this._dbIsOpen === false) { throw new Error("DB not opened !") }
    return this._ipc.invoke('update-db', { name, email, password, command: 'add'})
  }

  public async updateUser(lastName: string, name: string, email: string, password: string) {
    if (this._dbIsOpen === false) { throw new Error("DB not opened !") }
    return this._ipc.invoke('update-db', { lastName, name, email, password, command: 'update'})
  }

  public async removeUser(name: string) {
    if (this._dbIsOpen === false) { throw new Error("DB not opened !") }
    return this._ipc.invoke('update-db', { name, command: 'remove'})
  }

}

const dbService = new DBService();
export default dbService;