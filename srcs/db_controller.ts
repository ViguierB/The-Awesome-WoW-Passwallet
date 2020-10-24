import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { app } from 'electron';

type dbItemType = {
  email: string,
  password: string
}

type dbType = {
  [account_name: string]: dbItemType
}

class DBControllerAlreadyExistExeption {
  constructor(private _message: string) {}

  public toString() { return `DBControllerAlreadyExistExeption: ${this._message}`; }
}

class DBControllerNotFoundExeption {
  constructor(private _message: string) {}

  public toString() { return `DBControllerNotFoundExeption: ${this._message}`; }
}

class DBHandle {

  constructor(private _db: dbType) {}

  public getAccount(name: string) {
    return this._db[name];
  }

  public updateAccount(name: string, content: dbItemType, creat: boolean = false) {
    if ((!this._db[name] && creat === true) || !!this._db[name]) {
      this._db[name] = {
        email: content.email,
        password: content.password
      };
    } else {
      throw new DBControllerNotFoundExeption("This account is not found, if you want to create it: turn creat parameter to true");
    }
  }

  public create(name: string, content: dbItemType) {
    if (!this._db[name]) {
      this._db[name] = {
        email: content.email,
        password: content.password
      };
    } else {
      throw new DBControllerAlreadyExistExeption("This account alredy exist, you must use updateAccount()");
    }
  }

  public remove(name: string) {
    if (!this._db[name]) {
      delete this._db[name]
    } else {
      throw new DBControllerNotFoundExeption("This account is not found");
    }
  }

  public getFriendlyArray() {
    return Object.keys(this._db).map(key => {
      
    });
  }

  public getBuffer() {
    return Buffer.from(JSON.stringify(this._db));
  }

}

export default abstract class DBController {

  private _algorithm = 'aes-256-cbc';
  private _iv = crypto.createHash("sha256").update('badiv').digest();

  protected abstract async getSecret(): Promise<string>;

  private async _lock(buffer: Buffer) {
    const secret = await this.getSecret();
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash("sha256").update(secret).digest();

    const cipher = crypto.createCipheriv(this._algorithm, key, iv);

    const c = Buffer.concat([ cipher.update(buffer), cipher.final() ]);

    return { iv: iv.toString('base64'), c: c.toString('base64'), e: 'base64' };
  }

  private async _unlock(locked: { iv: string, c: string, e: string }) {
    const secret = await this.getSecret();
    const iv = Buffer.from(locked.iv, locked.e as any);
    const buffer = Buffer.from(locked.c, locked.e as any);
    const key = crypto.createHash("sha256").update(secret).digest();

    const decipher = crypto.createDecipheriv(this._algorithm, key, iv);

    const d = Buffer.concat([ decipher.update(buffer), decipher.final() ]);

    return d;
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
          const locked = JSON.parse(buffer.toString())
          var unlockedbd = await this._unlock(locked);
        } catch (e) {
          reject(e);
          return;
        }

        try {
          const db = JSON.parse(unlockedbd.toString());
          resolve(new DBHandle(db));
        } catch (_e) {
          reject("This file is not a valid JSON");
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

}