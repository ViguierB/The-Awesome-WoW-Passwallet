import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Settings } from './settings';
import { DB } from './db';
import DBControllerKeytar, { controllerType as controllerKeytarType } from './db_controller_keytar';
import DBControllerUserPassword, { controllerType as controllerUserPasswordType } from './db_controller_user_password';
import { Executor } from './executor';
import DBController from './db_controller';
import Misc from './misc';

const isDev = process.env.IS_DEV === 'true';

function getFullFileName(base: string) {
  if (!isDev && process.platform === 'linux') {
    const basePath = path.join(app.getPath('appData'), 'the-awesome-wow-passwallet');
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync('basePath');
    }
    return path.join(basePath, base);
  }
  return base;
}

const dbFilePath = getFullFileName('accounts.db');
const settingsFilePath = getFullFileName('settings.json');

function createWindow () {
  const win = new BrowserWindow({
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

  const db = new DB(win, dbFilePath);
  const settings = new Settings(win, db, settingsFilePath);
  new Misc(win);

  settings.open().catch((e) => {
    console.error(e);
    app.quit();
  }).then(() => {

    const providers = [
      { type: controllerKeytarType, ctor: DBControllerKeytar },
      { type: controllerUserPasswordType, ctor: DBControllerUserPassword }
    ]

    DBController.getProviderCtor(dbFilePath, providers, DBControllerKeytar).then(ctor => {
      db.changeController(ctor);
      return db.open();
    }).catch(e => {
      db.changeController(DBControllerKeytar);
      win.once('ready-to-show', () => {
        setTimeout(win.webContents.send.bind(win.webContents, 'show-toast', {
          title: 'error',
          message: 'Cannot open database:\n' + e.message,
          type: 'error'
        }), 1000);
      });
      fs.unlinkSync(dbFilePath);
      return db.open();
    }).then(() => {
      win.once('ready-to-show', () => {
        win.show()
      });

      ipcMain.handle('launch-wow-for-user', async (_e, user: string) => {

          let executor = new Executor(settings, db.getHandle());
  
          try {
            await executor.start(user);
            // setTimeout(() => global.gc(), 0);
          } catch (e) {
            win.webContents.send('show-toast', {
              title: 'error',
              message: 'Cannot start World of Warcraft:\n' + e.message,
              type: 'error'
            });
          }

      });

      if (isDev) {
        win.loadURL('http://localhost:3000/');
        // win.loadURL(`file://${path.resolve(app.getAppPath(), '../html/build/index.html/')}`);

        if (process.platform === 'win32') {
          const devtools = new BrowserWindow();
          win.webContents.setDevToolsWebContents(devtools.webContents)
          win.webContents.openDevTools({ mode: 'detach' })

          win.on('close', () => {
            devtools.close();
          })
        } else {
          win.webContents.openDevTools();
        }
      } else {
        win.loadURL(`file://${path.resolve(app.getAppPath(), 'html/build/index.html')}`);
        win.removeMenu();
      }
    }, (_e: any) => {
      console.error(_e);
      app.quit();
    })

    win.on('close', async () => {
      settings.save()
      db.save()
    });
  })

}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  setTimeout(() => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }, 250)
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})