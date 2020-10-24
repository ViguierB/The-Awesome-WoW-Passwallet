import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import DBControllerKeytar from './db_controller_keytar';

const isDev = process.env.IS_DEV === 'true';

function createWindow () {
  const win = new BrowserWindow({
    width: 815,
    height: 430,
    minWidth: 450,
    minHeight: 250,
    webPreferences: {
      nodeIntegration: true
    }
  })

  //win.loadFile('../html/build/index.html');
  if (isDev) {
    win.loadURL('http://localhost:3000/');
    win.webContents.openDevTools();
  } else {
    win.loadURL(`file://${path.resolve(app.getAppPath(), '../html/build/index.html')}`);
    win.removeMenu();
  }

  const db = new DBControllerKeytar;

  ipcMain.once('on-ipc-service-ready', () => {

    db.open('test.db').then((handle) => {

      ipcMain.on('on-ipc-service-ready', () => {
        win.webContents.send('on-db-opened');
      })

      ipcMain.handle('get-db', async (_event, _someArgument) => {
        return handle.getArrayForRender();
      })

      ipcMain.handle('update-db', async (_event, payload) => {
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
        win.webContents.send('on-db-edited');
        return;
      });
      
      win.webContents.send('on-db-opened');

      win.on('close', () => {
        db.save('test.db', handle).then(() => console.log('database saved'));
      });
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