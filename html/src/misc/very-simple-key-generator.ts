export class KeyGenerator {
  private __lastid = 0;

  public get() { return ++this.__lastid; }
};

const gen = new KeyGenerator();

export default gen;