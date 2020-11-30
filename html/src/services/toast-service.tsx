import React, { CSSProperties } from 'react';
import ToastContext, { ToastItemProps } from '../components/toast-context';
import { ReactComponent as InfoIcon } from "../assets/ask.svg";
import { ReactComponent as WarnIcon } from "../assets/danger.svg";
import { ReactComponent as ErrorIcon } from "../assets/error.svg";

declare global {
  interface Window {
    electron: any;
  }
}

type MessageType = 'message' | 'info' | 'warn' | 'error';

type ToastMessageOptions = {
  icon?: typeof InfoIcon,
  duration?: number
}

class ToastService {

  private _ipc = window.electron.ipcRenderer;

  private _context: ToastContext | null = null;

  constructor() {
    this._ipc.on('show-toast', (_e: any, req: {
      title?: string, message: string, type?: MessageType, options?: ToastMessageOptions
    }) => {
      this.showMessage(req.title, req.message, req.type, req.options);
    });
  }

  public registerContext(context: ToastContext) {
    this._context = context;
  }

  public addToast(props: ToastItemProps) {
    return this._context?.addToast(this._context.makeToast(props));
  }

  private _selectTitle(title: string | null | undefined, type: MessageType) {
    switch (type) {
      case 'message': {
        if (!title) {
          throw new Error('Title must be set for type = \'message\'');
        }
        return title;
      }
      case 'error': return title || 'error';
      case 'info': return title || 'information';
      case 'warn': return title || 'warning'
    }
  }

  private _createMessageContainer(message: string, type: MessageType, options?: ToastMessageOptions) {
    const containerStyle: CSSProperties = {
      display: 'flex',
    }

    const iconStyle: CSSProperties = {
      width: '42px',
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

    switch (type) {

      case 'message': {
        const ref = assingInnerText();
        if (!!options?.icon) {
          const icon = React.createFactory(options.icon)({ style: iconStyle });

          return <div style={containerStyle}>
            {icon}
            <span style={textStyle} ref={ref}> </span>
          </div>;
        }
        return <span style={textStyle} ref={ref}> </span>;
      }
      case 'error': {
        const ref = assingInnerText();
        return <div style={containerStyle}>
          <ErrorIcon style={iconStyle} />
          <span style={textStyle} ref={ref}> </span>
        </div>;
      }
      case 'info': {
        const ref = assingInnerText();
        return <div style={containerStyle}>
          <InfoIcon style={iconStyle} />
          <span style={textStyle} ref={ref}> </span>
        </div>;
      }
      case 'warn': {
        const ref = assingInnerText();
        return <div style={containerStyle}>
          <WarnIcon style={iconStyle} />
          <span style={textStyle} ref={ref}> </span>
        </div>;
      }
    }
  }

  public showMessage(title: string | null | undefined, message: string, type: MessageType = 'message', options?: ToastMessageOptions) {
    this.addToast({
      title: this._selectTitle(title, type),
      content: this._createMessageContainer(message, type, options),
      duration: options?.duration || 5000
    })
  }

};

const toastService = new ToastService();

export default toastService;