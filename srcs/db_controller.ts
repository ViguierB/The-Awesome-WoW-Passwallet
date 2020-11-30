import * as fs from 'fs';
import * as crypto from 'crypto';
import { BrowserWindow } from 'electron';

const DBVERSION = 1;

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T

type dbItemType = {
  email: string,
  password: string,
  index?: number
}

type dbType = {
  [account_name: string]: dbItemType
}

class DBControllerException {

  constructor(protected _message: string) {}

  getLocalMessage() {
    return this._message;
  }

  toString() {
    return `${this.constructor.name} ${this._message}`;
  }
}

class DBControllerAlreadyExistException extends DBControllerException {}
class DBControllerBadTypeException extends DBControllerException {}
class DBControllerNotFoundException extends DBControllerException {}

export class DBHandle {

  constructor(private _db: dbType) {}

  public getAccount(name: string) {
    return this._db[name];
  }

  public updateAccount(name: string, content: dbItemType, creat: boolean = false) {
    if ((!this._db[name] && creat === true) || !!this._db[name]) {
      if (content.password === '') {
        content.password = this._db[name]?.password || "";
      }
      this._db[name] = {
        email: content.email,
        password: content.password,
        index: Object.keys(this._db).length
      };
    } else {
      throw new DBControllerNotFoundException("This account is not found, if you want to create it: turn creat parameter to true");
    }
  }

  public create(name: string, content: dbItemType) {
    if (!this._db[name]) {
      this._db[name] = {
        email: content.email,
        password: content.password,
        index: content.index || Object.keys(this._db).length
      };
    } else {
      throw new DBControllerAlreadyExistException("This account already exist");
    }
  }

  public remove(name: string) {
    if (!!this._db[name]) {
      let save = this._db[name];
      delete this._db[name];
      return save;
    } else {
      throw new DBControllerNotFoundException("This account is not found");
    }
  }

  public applySort(sortArray: [{ name: string, index: number }]) {
    sortArray.forEach(item => {
      (this._db[item.name] || {}).index = item.index
    });
  }

  public getArrayForRender() {
    return Object.keys(this._db).map(key => ({
      name: key,
      email: this._db[key].email,
      index: this._db[key].index
    }));
  }

  public getBuffer() {
    return Buffer.from(JSON.stringify(this._db));
  }

}

export default abstract class DBController {

  private   _algorithm = 'aes-256-cbc';
  protected _mainWin: BrowserWindow | null = null;

  protected abstract onGetSecretError(e: Error): Promise<{ retry: boolean }>;
  protected abstract getSecret(): Promise<string>;
  protected abstract getType(): string;

  public setMainWindow(win: BrowserWindow) { this._mainWin = win; }

  private _fixDataBaseDataIfNeeded(dbOptions: ThenArg<ReturnType<DBController['_lock']>>, db: any) {
    try {
      db = JSON.parse(db.toString());
    } catch {
      throw new Error('This file is not a valid JSON')
    }
    switch (dbOptions.v) {
      case (1): return db;
      case (undefined): {
        Object.keys(db).forEach((k, i) => db[k].index = i);
        return db;
      }
    }
    throw new Error('The account.db file is corrupted !');
  }

  private async _lock(buffer: Buffer) {
    const secret = await this.getSecret();
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash("sha256").update(secret).digest();

    const cipher = crypto.createCipheriv(this._algorithm, key, iv);

    const c = Buffer.concat([ cipher.update(buffer), cipher.final() ]);

    return { iv: iv.toString('base64'), c: c.toString('base64'), e: 'base64', t: this.getType(), v: DBVERSION };
  }

  private async _unlock(locked: ThenArg<ReturnType<DBController['_lock']>>): Promise<Buffer> {
    if (locked.t !== this.getType()) {
      throw new DBControllerBadTypeException(`Controller type is not matching (expected '${this.getType()}', got '${locked.t}'`);
    }
    try {
      const secret = await this.getSecret();
      const iv = Buffer.from(locked.iv, locked.e as any);
      const buffer = Buffer.from(locked.c, locked.e as any);
      const key = crypto.createHash("sha256").update(secret).digest();

      const decipher = crypto.createDecipheriv(this._algorithm, key, iv);

      const d = Buffer.concat([ decipher.update(buffer), decipher.final() ]);

      return d;
    } catch (e) {
      const { retry } = await this.onGetSecretError(e);
      if (retry) {
        return await this._unlock(locked);
      }
      throw e;
    }
  }

  public open(filepath: string) {
    return new Promise<DBHandle>((resolve, reject) => {
      fs.readFile(filepath, null, async (err, buffer) => {
        if (err) {
          if (err.code !== 'ENOENT') { reject(err); return; }

          // return a new empty DBHandle in case of file not found
          resolve(new DBHandle({}));
        }
        
        try {
          const locked = JSON.parse(buffer.toString());
          var unlockedbd = this._fixDataBaseDataIfNeeded(locked, await this._unlock(locked));
          resolve(new DBHandle(unlockedbd));
        } catch (e) {
          reject(e);
          return;
        }
      })
    });
  }

  public save(filepath: string, dbHandle: DBHandle) {
    return new Promise<void>(async (resolve, reject) => {
      const buffer = dbHandle.getBuffer();

      try {
        var lockedbd = await this._lock(buffer);
      } catch (e) {
        reject(e);
        return;
      }

      fs.writeFile(filepath, JSON.stringify(lockedbd), (err) => {
        if (!!err) { reject(err); return; }
        resolve();
      })
    });
  }

  public static getProviderCtor(filepath: string, controllers: {type: string, ctor: typeof DBController}[], cdefault: typeof DBController) {
    return new Promise<typeof DBController>((resolve, reject) => {
      fs.readFile(filepath, null, async (err, buffer) => {
        if (err) {
          if (err.code !== 'ENOENT') { reject(err); return; }

          // return a new empty DBHandle in case of file not found
          resolve(cdefault);
        }

        const { t } = JSON.parse(buffer.toString());

        controllers.some((v) => {
          if (v.type === t) {
            resolve(v.ctor);
            return true;
          }
          return false;
        })
      });
    });
  }

}