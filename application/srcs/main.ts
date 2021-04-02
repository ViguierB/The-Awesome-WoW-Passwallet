import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'original-fs'
import { Settings } from './settings';
import { DB } from './db';
import DBControllerKeytar, { controllerType as controllerKeytarType } from './db_controller_keytar';
import DBControllerUserPassword, { controllerType as controllerUserPasswordType } from './db_controller_user_password';
import { Executor } from './executor';
import DBController from './db_controller';
import Misc from './misc';

declare global {
  var basepath: string;
}

export class TheAwesomePasswalletMainWindow {

  private _win: BrowserWindow;
  private _dbFilePath = this._getFullFileName('accounts.db');
  private _settingsFilePath = this._getFullFileName('settings.json');
  private _registeredChannels: Array<string> = [];
  private _originalIpcMainHandle: any;

  constructor(private _isDev = false) {
    this._win = new BrowserWindow({
      width: 815,
      height: 430,
      minWidth: 450,
      minHeight: 250,
      show: false,
      icon: path.resolve(app.getAppPath() + '/icon.png'),
      webPreferences: {
        nodeIntegration: true,
        enableWebSQL: false,
        webgl: false
      }
    });
  }

  private _getFullFileName(base: string) {
    if (!this._isDev) {
      const basePath = global.basepath;
      return path.join(basePath, base);
    }
    return base;
  }

  private _createWindow () {
    return new Promise<void>((resolve) => {
      const db = new DB(this._win, this._dbFilePath);
      const settings = new Settings(this._win, db, this._settingsFilePath);
      new Misc(this._win);
    
      settings.open().catch((e) => {
        console.error(e);
        app.quit();
      }).then(() => {
    
        const providers = [
          { type: controllerKeytarType, ctor: DBControllerKeytar },
          { type: controllerUserPasswordType, ctor: DBControllerUserPassword }
        ]
    
        DBController.getProviderCtor(this._dbFilePath, providers, DBControllerKeytar).then(ctor => {
          db.changeController(ctor);
          return db.open();
        }).catch(e => {
          db.changeController(DBControllerKeytar);
          this._win.once('ready-to-show', () => {
            setTimeout(this._win.webContents.send.bind(this._win.webContents, 'show-toast', {
              title: 'error',
              message: 'Cannot open database:\n' + e.message,
              type: 'error'
            }), 1000);
          });
          fs.unlinkSync(this._dbFilePath);
          return db.open();
        }).then(() => {
          this._win.once('ready-to-show', () => {
            this._win.show()
            resolve();
          });
    
          ipcMain.handle('launch-wow-for-user', async (_e, user: string) => {
    
              let executor = new Executor(settings, db.getHandle());
      
              try {
                await executor.start(user);
                // setTimeout(() => global.gc(), 0);
              } catch (e) {
                this._win.webContents.send('show-toast', {
                  title: 'error',
                  message: 'Cannot start World of Warcraft:\n' + e.message,
                  type: 'error'
                });
              }
    
          });
    
          if (this._isDev) {
            this._win.loadURL('http://localhost:3000/');
            // win.loadURL(`file://${path.resolve(app.getAppPath(), '../html/build/index.html/')}`);
    
            if (process.platform === 'win32') {
              const devtools = new BrowserWindow();
              this._win.webContents.setDevToolsWebContents(devtools.webContents)
              this._win.webContents.openDevTools({ mode: 'detach' })
    
              this._win.on('close', () => {
                devtools.close();
              })
            } else {
              this._win.webContents.openDevTools();
            }
          } else {
            this._win.loadFile(require.resolve('./index.html'));
            this._win.removeMenu();
          }
        }, (_e: any) => {
          console.error(_e);
          app.quit();
        })
    
        this._win.on('close', async () => {
          settings.save()
          db.save()
        });
      })
    });
  }

  async open() {
    let self = this;

    this._originalIpcMainHandle = ipcMain.handle;
    let capture = this;
    ipcMain.handle = function (channel, listener) {
      self._registeredChannels.push(channel);
      capture._originalIpcMainHandle.apply(this, [channel, listener]);
    }

    return this._createWindow();
  }

  close() {
    ipcMain.removeAllListeners();
    ipcMain.handle = this._originalIpcMainHandle;
    this._registeredChannels.forEach(chan => ipcMain.removeHandler(chan))
    this._win.close();
  }

  getWindow() {
    return this._win;
  }

  getVersion() {
    const pjson = require('./package.json');
    return pjson.version;
  }

}