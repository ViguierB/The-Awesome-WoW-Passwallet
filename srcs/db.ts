import { BrowserWindow, ipcMain } from "electron";
import DBControllerKeytar from "./db_controller_keytar";
import DBController from './db_controller';

export class DB {

  private _handle: any = null;
  private _db: DBController;

  constructor(private _win: BrowserWindow) {

    this._db = new DBControllerKeytar;

    ipcMain.once('on-ipc-service-ready', () => {

      this._db.open('test.db').then((handle) => {

        this._handle = handle;

        ipcMain.on('on-ipc-service-ready', () => {
          this._win.webContents.send('on-db-opened');
        })

        ipcMain.handle('get-db', async (_event, _someArgument) => {
          return handle.getArrayForRender();
        })

        ipcMain.handle('update-db', (e, p) => this._updateDBEventasync(handle, e, p))
        
        this._win.webContents.send('on-db-opened');
      });
    })

  }

  close() {
    if (!!this._handle) {
      this._db.save('test.db', this._handle).then(() => console.log('database saved'));
    };
  }

  private _updateDBEventasync(handle: any, _event: Electron.IpcMainInvokeEvent, payload: any) {
    switch (payload.command) {
      case "update": {
        if (payload.name === payload.lastName) {
          handle.updateAccount(payload.name, {
            email: payload.email,
            password: payload.password
          }); 
        } else {
          handle.remove(payload.lastName);
          handle.create(payload.name, {
            email: payload.email,
            password: payload.password
          }); 
        }
      }; break;
      case "add": {
        handle.create(payload.name, {
          email: payload.email,
          password: payload.password
        }); 
      }; break;
      case "remove": {
        handle.remove(payload.name)
      }; break;
      default: console.error("unkown payload command"); break;
    }
    this._win.webContents.send('on-db-edited');
    return;
  }

}