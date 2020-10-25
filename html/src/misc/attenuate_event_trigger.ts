
class _NullHandle {};
class AttenuateEventTrigger {
  
  private _nullHandle = new _NullHandle();
  private _waitTime: number;

  constructor(waitTime: number = 1000) {
    this._waitTime = waitTime;
  }

  wrap(handler: (...args: any[]) => any) {
    let handle = this._nullHandle;

    return (...args: any[]) => {
      if (!(handle instanceof _NullHandle)) {
        clearTimeout(handle);
      }
      handle = setTimeout(() => { handle = this._nullHandle; handler(...args); }, this._waitTime);
    }
  }
};

export default AttenuateEventTrigger;