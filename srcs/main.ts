import { app, BrowserWindow } from 'electron';
import * as path from 'path';

const isDev = true;

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  //win.loadFile('../html/build/index.html');
  if (isDev) {
    win.loadURL('http://localhost:3000/');
  } else {
    win.loadURL(`file://${path.resolve(app.getAppPath(), '../html/build/index.html')}`);
  }
  win.webContents.openDevTools();
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