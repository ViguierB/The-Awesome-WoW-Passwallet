import React, { Component, ReactElement } from 'react';
import { ReactComponent as CloseIcon } from "../assets/close.svg";
import gen from '../misc/very-simple-key-generator';
import toastService from '../services/toast-service';
import "./toast-context.css";

export type ToastItemProps = {
  title: string,
  content: ReactElement | string,
  duration: number
}

type ToastItemPropsInternal = ToastItemProps & {
  lkey: number,
  key: number,
  _context: ToastContext,
}

export class ToastItem extends Component<ToastItemPropsInternal, {}> {

  private _itemRef = React.createRef<HTMLDivElement>();
  private _isMouseInner = false;
  private _forceClose= false;
  private _closeTimeoutHandle?: NodeJS.Timeout;

  // constructor(props: ToastItemPropsInternal) {
  //   super(props);
  // }

  componentDidMount() {
    this._itemRef.current?.addEventListener('mouseenter', () => {
      this._isMouseInner = true;
    });

    this._itemRef.current?.addEventListener('mouseleave', () => {
      this._isMouseInner = false;
    });

    this._itemRef.current?.classList.add('toast-item-show');

    if (this.props.duration > 0) {
      this._closeTimeoutHandle = setTimeout(this.close.bind(this), this.props.duration);
    }
  }

  close() {
    if (this._isMouseInner && !this._forceClose) {
      setTimeout(this.close.bind(this), 500);
      return;
    }

    if (!!this._closeTimeoutHandle) {
      clearTimeout(this._closeTimeoutHandle);
    }

    this._itemRef.current?.classList.remove('toast-item-show');
    setTimeout(() => {
      this._itemRef.current?.classList.add('toast-before-close');
    }, 10);
    setTimeout(() => {
      this.props._context.removeToast(this.props.lkey);
    }, this.props._context.getTransistionDuration() + 50);
  }

  render() {
    return (<div key={this.props.lkey} ref={this._itemRef}
      className={`toast-item`}
      style={{ animationDuration: this.props._context.getTransistionDuration() + 'ms' }}
    >
      <div className='toast-item-head '>
        <span className='toast-item-title'>{this.props.title}</span>
        <div className="toast-item-close" onClick={() => { this._forceClose = true; this.close(); }}>
          <CloseIcon className='icon' />
        </div>
      </div>
      <div className='toast-item-body'>
        {this.props.content}
      </div> 
    </div>)
  }
}

export default class ToastContext extends Component {

  private _transistionDuration = 300;

  private _subjects: React.CElement<ToastItemPropsInternal, ToastItem>[] = []

  constructor(props: any) {
    super(props);

    toastService.registerContext(this);
  }

  public makeToast = (() => {
    return (props: ToastItemProps) => {
      const key = gen.get();
      return React.createElement(ToastItem, { ...props, key: key, lkey: key, _context: this});
    }
  })()

  public addToast(toast: React.CElement<ToastItemPropsInternal, ToastItem>) {
    this._subjects.push(toast);
    this.forceUpdate();
    return toast;
  }

  public removeToast(lkey: number) {
    const idx = this._subjects.findIndex(s => (s.props as any).lkey === lkey);
    if (idx >= 0) {
      this._subjects.splice(idx, 1);
      this.forceUpdate();
    }
  }

  getTransistionDuration() { return this._transistionDuration; }
  setTransistionDuration(duration: number) { this._transistionDuration = duration; }

  render() {
    return (
      <div id="pw-toast-context">
        <div id="pw-toast-container">
          {this._subjects}
        </div>
      </div>
    )
  }

}