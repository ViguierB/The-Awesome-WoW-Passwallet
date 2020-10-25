import gen from './very-simple-key-generator'

class Emitter<T> {
  private _handlers: any[] = [];

  subcribe(func: (handle: { unsubscribe: () => void }, arg: T) => void) {
    const id = gen.get();
    const handle = {
      unsubscribe: () => {
        let idx = this._handlers.findIndex(el => el.id === id);

        if (idx >= 0) {
          this._handlers.splice(idx, 1);
        }
      }
    };
    let elem = {
      id, func: (arg1: T) => func(handle, arg1)
    }
    this._handlers.push(elem);
    return {
      unsubscribe: handle.unsubscribe
    }
  }

  emit(arg: T) {
    this._handlers.forEach(e => {
      e.func(arg);
    });
  }
}

export default Emitter;