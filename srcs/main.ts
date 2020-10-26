import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { Settings } from './settings';
import { DB } from './db';
import DBControllerKeytar, { controllerType as controllerKeytarType } from './db_controller_keytar';
import DBControllerUserPassword, { controllerType as controllerUserPasswordType } from './db_controller_user_password';
import { selectExecutor } from './executor';

const isDev = process.env.IS_DEV === 'true';

const dbFilePath = 'accounts.db';
const settingsFilePath = 'settings.json';

function createWindow () {
  const win = new BrowserWindow({
    width: 815,
    height: 430,
    minWidth: 450,
    minHeight: 250,
    webPreferences: {
      nodeIntegration: true,
      enableWebSQL: false,
      webgl: false
    }
  })

  const db = new DB(win, dbFilePath);
  const settings = new Settings(win, db, settingsFilePath);

  settings.open().catch((e) => {
    console.error(e);
    app.quit();
  }).then(() => {
    [
      { type: controllerKeytarType, ctor: DBControllerKeytar },
      { type: controllerUserPasswordType, ctor: DBControllerUserPassword }
    ].some((v) => {
      if (v.type === settings.settings.dbSecretProvider) {
        db.changeController(v.ctor);
        return false;
      }
      return true;
    })

    db.open().then(() => {

      ipcMain.handle('launch-wow-for-user', async (_e, user: string) => {
        const ExecutorCtor = selectExecutor();
        const ex = new ExecutorCtor(settings, db.getHandle());
        
        await ex.start(user);

        return;
      });

      if (isDev) {
        win.loadURL('http://localhost:3000/');
        win.webContents.openDevTools();
      } else {
        win.loadURL(`file://${path.resolve(app.getAppPath(), '../html/build/index.html')}`);
        win.removeMenu();
      }
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