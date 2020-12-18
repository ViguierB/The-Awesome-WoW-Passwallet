import { ReactElement } from 'react';
import ModalContext from '../components/modal-context';
import gen from '../misc/very-simple-key-generator';

class ModalService {

  private _context: ModalContext | null = null;
  private _ready = false
  private _resolveStack: Array<() => void> = [];
  private _subject: { id: number, component: ReactElement } | null = null;

  public registerContext(context: ModalContext) {
    this._context = context;
    this._ready = true;
  }

  public openModal(subject: ReactElement) {
    const hsubject = { id: gen.get(), component: subject };
    
    return (
      new Promise<void>(resolve => {
        if (this._ready) {
          resolve();
        } else {
          this._resolveStack.push(resolve);
        }
      }).then(() => {
        this._subject = hsubject;
        this._ready = false;
        this._context?.forceUpdate();
      })
    )
    
  }

  public getSubject() {
    return this._subject;
  }

  public closeModal() {
    this._subject = null;
    if (this._resolveStack.length > 0) {
      const resolve = this._resolveStack.shift();
      !!resolve && resolve();
    } else {
      this._ready = true;
      this._context?.forceUpdate();
    }
  }

};

const modalService = new ModalService();

export default modalService;