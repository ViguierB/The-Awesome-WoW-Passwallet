import { BrowserWindow } from 'electron';

const style = `
  html, body, #container {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    color: rgb(223, 223, 223);
    background-color: #3a3939;
  }

  form {
    margin: 0;
    margin-block-end: 0;
  }

  #container {
    display: flex;
    width: calc(100% - 40px);
    height: calc(100% - 40px);
    padding: 10px;
    margin: 10px;
    background-color: rgb(33, 33, 33);
    flex-direction: column;
  }
`

const script = `
  (function(){
    const container = document.getElementById('container');
    
    electron.ipcRenderer.on('progress', (_e, text) => {
      const e = document.createElement('div');

      e.innerText = '$>   ' + text;
      container.appendChild(e);
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 0);
    });
  })();
`;

const html = Buffer.from(`<html>
  <head>
    <style>
      ${style}
    </style>
  </head>
  <body>
    <script>window.electron = require('electron')</script>
    <div id='container'> </div>
    <script>${script}</script>
  </body>
</html>`, 'binary').toString('base64');

export default class FirstInstallWindow {

  private _win: BrowserWindow; 

  constructor() {
    this._win = new BrowserWindow({
      modal: true,
      show: false,
      width: 420,
      height: 95,
      useContentSize: true,
      title: 'First install',
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        enableWebSQL: false,
        webgl: false
      }
    });

    this._win.loadURL("data:text/html;base64," + html);
  }

  public getProgressHandler() {
    let r = false;
    return (...message: any[]) => {
      if (r) {
        this._win.webContents.send('progress', ...message);
      } else {
        this._win.once('ready-to-show', () => {
          r = true;
          this._win.webContents.send('progress', ...message);
        });
      }
    };
  }

  public start() {
    this._win.once('ready-to-show', () => {
      this._win.removeMenu();
      // const devtools = new BrowserWindow();
      // this._win.webContents.setDevToolsWebContents(devtools.webContents)
      // this._win.webContents.openDevTools({ mode: 'detach' })
      this._win.show();
    })
  }

  public close() {
    this._win.close();
  }

}