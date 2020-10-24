import { app, BrowserWindow } from 'electron';
import * as path from 'path';

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
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})