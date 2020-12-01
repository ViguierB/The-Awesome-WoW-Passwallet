import * as fs from 'fs';
import { BrowserWindow, ipcMain } from "electron";
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
      return this._handle.getArrayForRender();
    });
    ipcMain.handle('update-db', (e, p) => {
      try {
        this._updateDBEvent(this._handle, e, p);
        return { error: false }
      } catch (e) {
        console.log(e);
        let message = (e instanceof Error) ? e.message : e.getLocalMessage();
        return { error: true, message: message }
      }
    });
    ipcMain.handle('import-db', async (_e, p) => {
      try {
        await this._importDB(p.path, p.password, p.merge);
        return { error: false }
      } catch (e) {
        return { error: true, message: e }
      }
    });
    ipcMain.handle('export-db', async (_e, p) => {
      try {
        await this._exportDB(p.path, p.password);
        return { error: false }
      } catch (e) {
        return { error: true, message: e }
      }
    });

    this._win.webContents.send('on-db-opened');
  }

  public save() {
    if (!!this._handle) {
      this._db.save(this._filename, this._handle).then(() => {});
    };
  }

  private async _importDB(filepath: string, password: string, merge: boolean) {
    await new Promise((resolve, reject) => {
      fs.access(filepath, fs.constants.R_OK, (err) => {
        if (!!err) {
          console.log(err);
          switch (err.code) {
            case 'ENOENT': reject('File not found'); break;
            case 'EACCES': reject('You do not have the rights to read this file'); break;
            default: reject('Unknow error: ' + err.code + ' (errno: ' + err.errno + ')')
          }
          return;
        }
        resolve(err);
      })
    })

    const controller = new DBControllerUserPassword();
    controller.setPassword(password);
    controller.setOpenOptions({ authorizeRetry: false });
    const handle = await controller.open(filepath).catch((e) => {
      if (!!e && !!e.reason && e.reason === 'BAD_DECRYPT') {
        return Promise.reject('Unable to open file: Bad password')
      } else {
        return Promise.reject('Unable to open file: Bad file format')
      }
    })

    if (!merge) {
      this._handle = handle;
    } else {
      this._handle.merge(handle);
    }
    this.save();
    this._win.webContents.send('on-db-edited');
  }

  private async _exportDB(filepath: string, password: string) {
    const controller = new DBControllerUserPassword();
    controller.setPassword(password);
    controller.save(filepath, this._handle);
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
        handle.remove(payload.name);
        handle.recalculateIndexs();
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