import { BrowserWindow, ipcMain } from "electron";
import DBControllerKeytar from "./db_controller_keytar";
import DBController, { DBHandle } from './db_controller';
import DBControllerUserPassword from './db_controller_user_password';

export class DB {

  private _handle: any = null;
  private _db: DBController;

  constructor(private _win: BrowserWindow, private _filename: string) {
    this._db = null as any;
  }

  public changeController(ctor: typeof DBController | any) {
    this._db = new ctor();
  }

  public getController() { return this._db; }

  public getHandle() {
    return this._handle;
  }

  public async open() {
    if (!this._db) {
      throw new Error('DBController not init');
    }

    const handle = await this._db.open(this._filename);
    this._handle = handle;
    ipcMain.on('on-ipc-service-ready', () => {
      this._win.webContents.send('on-db-opened');
    });
    ipcMain.handle('get-db', async (_event, _someArgument) => {
      return handle.getArrayForRender();
    });
    ipcMain.handle('update-db', (e, p) => {
      try {
        this._updateDBEvent(handle, e, p);
      } catch (e) {
        console.log(e);
        let message = (e instanceof Error) ? e.message : e.getLocalMessage();
        return { error: true, message: message }
      }
    });
    this._win.webContents.send('on-db-opened');
  }

  public save() {
    if (!!this._handle) {
      this._db.save(this._filename, this._handle).then(() => {});
    };
  }

  private _checkFields(payload: { name: string, email: string, password: string}, checkPassword = false) {
    let res = {
      error: false,
      messages: <string[]>[],
      getMessage: function () {
        return this.messages.join('\n');
      }
    }
    if (payload.name === undefined || payload.name === '') {
      res.error = true;
      res.messages.push('Name cannot be empty')
    }
    if (payload.email === undefined || payload.email === '') {
      res.error = true;
      res.messages.push('Email cannot be empty')
    }
    if ((payload.password === undefined || payload.password === '') && checkPassword) {
      res.error = true;
      res.messages.push('Password cannot be empty')
    }

    if (res.error) {
      throw new Error(res.getMessage());
    }
  }

  private _updateDBEvent(handle: DBHandle, _event: Electron.IpcMainInvokeEvent, payload: any) {
    switch (payload.command) {
      case "update": {
        this._checkFields(payload);
        if (payload.name === payload.lastName) {
          handle.updateAccount(payload.name, {
            email: payload.email,
            password: payload.password
          }); 
        } else {
          const { index } = handle.remove(payload.lastName);
          handle.create(payload.name, {
            email: payload.email,
            password: payload.password,
            index
          }); 
        }
      }; break;
      case "add": {
        this._checkFields(payload, true);
        handle.create(payload.name, {
          email: payload.email,
          password: payload.password
        }); 
      }; break;
      case "remove": {
        handle.remove(payload.name)
      }; break;
      case "update-sorting": {
        handle.applySort(payload.sortArray)
      }; break;
      default: console.error("unkown payload command"); break;
    }
    this.save();
    this._win.webContents.send('on-db-edited');
    return;
  }

}