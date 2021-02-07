import React, { CSSProperties } from "react";
import toastService from "./toast-service";
import { ReactComponent as UpdatedIcon } from "../assets/updated.svg";

declare global {
  interface Window {
    electron: any;
  }
}

class MiscService {

  private _ipc = window.electron.ipcRenderer;
  private _updateLock = false;

  private _createUpdateToastContent(message: string, okButtonHandle: () => void) {
    const containerStyle: CSSProperties = {
      display: 'flex',
    }

    const iconStyle: CSSProperties = {
      width: '42px',
      height: '42px',
      fill: 'rgb(223, 223, 223)',
      marginRight: '15px',
    }

    const textStyle: CSSProperties = {
      marginTop: 'auto',
      marginBottom: 'auto',
      color: 'rgb(223, 223, 223)',
      fontSize: 'smaller'
    }

    let assingInnerText = () => {
      const ref = React.createRef<HTMLSpanElement>();
      
      let f = () => setTimeout(() => {
        const c = ref.current;

        if (!c) { f(); return; }
        c.innerHTML = message.replace(/\n/g,"<br>");
      });

      f();

      return ref;
    }

    const ref = assingInnerText();
    return <div style={containerStyle}>
      <UpdatedIcon style={iconStyle} />
      <span style={textStyle} ref={ref}> </span>
      <div style={{ marginTop: 'auto' }} onClick={okButtonHandle}>
        <div style={{
          transform: 'translate(10px, 15px)',
          padding: '5px 25px',
          backgroundColor: '#5362ce',
          borderTopLeftRadius: '5px',
        }}>Ok</div>
      </div>
    </div>;
  }

  getPlatform() {
    return this._ipc.invoke('get-platform');
  }

  openFileDialog(options: any = {}) {
    return this._ipc.invoke('open-file-dialog', options).then((f: any) => {
      if (f.canceled) {
        return undefined;
      } else if (f.filePaths.length > 1) {
        return { files: f.filePaths }
      } else {
        return { file: f.filePaths[0] }
      }
    }) as Promise<{
      files: Array<string> | undefined,
      file: string | undefined
    }>;
  }

  saveFileDialog(options: any = {}) {
    return this._ipc.invoke('save-file-dialog', options).then((f: any) => {
      if (f.canceled) {
        return undefined;
      } else {
        return { file: f.filePath }
      }
    })
  }

  initUpdateHandler() {
    this._ipc.once('update-ready-install-request', (event: any, data: any) => {
      if (this._updateLock) { return; }
      this._updateLock = true;
      toastService.addToast({
        title: "Update Ready",
        content: this._createUpdateToastContent(
          `A new update is ready to install (${data.version} over ${data.currentVersion})\nRestart the software now ?`,
          () => this._ipc.send('update-ready-install-response', true)
        ),
        duration: 999999
      });
    })
  }

}

const miscService = new MiscService();
export default miscService;