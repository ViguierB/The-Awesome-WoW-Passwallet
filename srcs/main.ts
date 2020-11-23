import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { Settings } from './settings';
import { DB } from './db';
import DBControllerKeytar, { controllerType as controllerKeytarType } from './db_controller_keytar';
import DBControllerUserPassword, { controllerType as controllerUserPasswordType } from './db_controller_user_password';
import { Executor } from './executor';

const isDev = process.env.IS_DEV === 'true';

const dbFilePath = 'accounts.db';
const settingsFilePath = 'settings.json';

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
        db.getController().setMainWindow(win);
        return true;
      }
      return false;
    })

    db.open().then(() => {
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
              message: 'Cannot start World of Warcraft: ' + e.message,
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