import { BrowserWindow, ipcMain } from 'electron';
import DBController from './db_controller';

export const controllerType = 'user-defined';

// TODO: link this to the front and ask user for a password
export default class DBControllerUserPassword extends DBController {

  private _password: string = '';

  public setPassword(pass: string) { this._password = pass; }

  private async askPassword() {

    if (!this._mainWin) { return "ERROR"; }

    let modal = new BrowserWindow({
      parent: this._mainWin,
      modal: true,
      show: false,
      width: 420,
      height: 95,
      autoHideMenuBar: true,
      title: 'Unlock database',
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        enableWebSQL: false,
        webgl: false
      }
    });

    const style = `
      html, body, #container {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        color: rgb(223, 223, 223);
        background-color: #3a3939;
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
          <input id='password-input' type='password' placeholder='Enter your password' />
          <div id='button-container'>
            <button id="cancel-button" class="button">Cancel</button>
            <button id="ok-button" class="button">Ok</button>
          </div>
        </div>
        <script>${script}</script>
      </body>
    </html>`, 'binary');

    modal.loadURL("data:text/html;base64," + html.toString('base64'));

    modal.once('ready-to-show', () => {
      modal.removeMenu();
      modal.show();
    })

    return new Promise<string>((resolve, reject) => {
      let resolved = false;

      ipcMain.on('modal-ask-password-send-password', (_e, password) => {
        resolved = true;
        resolve(password);
        modal.close();
      });

      ipcMain.on('modal-ask-password-close', (_e, password) => {
        resolved = false;
        modal.close();
      });

      modal.on('closed', () => {
        if (!resolved) {
          reject(new Error('no password given'));
        }
      })

    })
  }

  protected getType() { return controllerType }

  protected async getSecret() {
    try {
      this._password = this._password || await this.askPassword();
      return this._password;
    } catch (e) {
      this._mainWin?.close();
      throw e;
    }
  }

}