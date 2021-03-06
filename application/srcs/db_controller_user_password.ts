import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import DBController from './db_controller';

const style = `
  html, body, #container {
    margin: 0;
    padding: 0;
    width: 420px;
    height: 95px;
    color: rgb(223, 223, 223);
    background-color: #3a3939;
  }

  form {
    margin: 0;
    margin-block-end: 0;
  }

  #container {
    display: flex;
    flex-direction: column;
  }

  #password-input, #button-container {
    width: 100%;
  }

  #password-input {
    display: block;
    border: none;
    outline: none;
    border-radius: 4px;
    font-size: initial;
    padding: 10px 20px;
    background-color: #2f2f2f;
    margin: 10px;
    width: calc(100% - 20px);
    color: rgb(223, 223, 223);
  }

  #button-container {
    margin-top: auto;
    display: flex;
  }

  .button {
    margin: 0;
    padding-top: 10px;
    padding-bottom: 10px;
    display: block;
    border: none;
    outline: none;
    width: 100%;
    color: rgb(223, 223, 223);
    transition: filter ease .3s;
    cursor: pointer;
  }

  .button:hover {
    filter: brightness(1.2);
  }

  #ok-button {
    background-color: #5362ce;
  }

  #cancel-button {
    background-color: #714040;
  }
`

const script = `
  (function(){
    const okButton = document.getElementById('ok-button');
    const cancelButton = document.getElementById('cancel-button');
    const passwordInput = document.getElementById('password-input');

    okButton.addEventListener('click', () => {
      electron.ipcRenderer.send('modal-ask-password-send-password', passwordInput.value)
    })

    cancelButton.addEventListener('click', () => {
      electron.ipcRenderer.send('modal-ask-password-close', null)
    })
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
    <div id='container'>
      <form id="formPassword">
        <input id='password-input' type='password' placeholder='Enter your password' autofocus/>
      </form>
      <div id='button-container'>
        <button id="cancel-button" class="button">Cancel</button>
        <button id="ok-button" class="button" form="formPassword" value="Submit">Ok</button>
      </div>
    </div>
    <script>${script}</script>
  </body>
</html>`, 'binary').toString('base64');

export const controllerType = 'user-defined';

// TODO: link this to the front and ask user for a password
export default class DBControllerUserPassword extends DBController {

  private _password: string | null = null;

  public setPassword(pass: string) { this._password = pass; }

  private async askPassword() {

    if (!this._mainWin) { return "ERROR"; }

    let modal = new BrowserWindow({
      parent: this._mainWin,
      modal: true,
      show: false,
      width: 420,
      height: 95,
      useContentSize: true,
      title: 'Unlock database',
      // resizable: false,
      webPreferences: {
        nodeIntegration: true,
        enableWebSQL: false,
        webgl: false
      }
    });

    modal.loadURL("data:text/html;base64," + html);

    modal.once('ready-to-show', () => {
      
      modal.show();
      
      if (process.env.IS_DEV === "true") {
        const devtools = new BrowserWindow();
        modal.webContents.setDevToolsWebContents(devtools.webContents)
        modal.webContents.openDevTools({ mode: 'detach' })
      } else {
        modal.removeMenu();
      }
    })

    return new Promise<string>((resolve, reject) => {
      let resolved = false;

      ipcMain.on('modal-ask-password-send-password', (_e, password) => {
        resolved = true;
        resolve(password);
        modal.close();
      });

      ipcMain.on('modal-ask-password-close', (_e, password) => {
        resolved = true;
        reject({ reason: 'cancel' });
        modal.close();
      });

      modal.on('closed', () => {
        if (!resolved) {
          reject({ reason: 'cancel' });
        }
        
        ipcMain.removeAllListeners('modal-ask-password-close');
        ipcMain.removeAllListeners('modal-ask-password-send-password');
      })

    })
  }

  protected getType() { return controllerType }

  protected async getSecret() {
      this._password = this._password || await this.askPassword();
      return this._password;
  }

  protected async onGetSecretError(e: Error) {
    this._password = null;
    if ((<any>e)?.reason === 'BAD_DECRYPT') {
      dialog.showErrorBox('Cannot decode database',
        'The password you gave is incorrect'
      )
      return { retry: true };
    }
    return { retry: false };
  }

}