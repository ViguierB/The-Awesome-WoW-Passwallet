import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { Settings } from './settings';
import { DB } from './db';

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

  const db = new DB(win);
  const settings = new Settings(win);

  settings.open('settings.json');
  
  win.on('close', db.close.bind(db));
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