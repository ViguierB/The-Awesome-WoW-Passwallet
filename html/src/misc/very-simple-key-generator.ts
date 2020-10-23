export class KeyGenerator {
  private __lastid = 0;

  public get() { return ++this.__lastid; }
};

export default new KeyGenerator();