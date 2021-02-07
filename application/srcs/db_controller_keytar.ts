import * as os from 'os';
import * as keytar from 'keytar';
import * as crypto from 'crypto';
import { dialog } from 'electron';
import DBController from './db_controller';

const username = os.userInfo().username
const serviceName = 'the-amazing-wow-passwallet-service'

export const controllerType = 'account-defined';

export default class DBControllerKeytar extends DBController {

  protected getType() { return controllerType; }

  protected async getSecret() {
    let key = await keytar.getPassword(serviceName, username);

    if (!!key) {
      return key;
    } else {
      key = crypto.randomBytes(32).toString('hex');
      await keytar.setPassword(serviceName, username, key);
      return key;
    }
  }

  protected async onGetSecretError(_e: Error) {
    await dialog.showMessageBox(this._mainWin as any, {
      type: "error",
      title: 'Cannot decode database',
      message: 'The password stocked in your os is not correct !\n\n' +
      'If you are trying to copy a accounts.db file to a new computer you must set password provider to Custom and enter a password.\n' +
      'The auto option use your os to store an auto generated password, so if you copy the database to an other computer we cannot decode it.',
      buttons: [ 'Ok' ]
    }).then((r) => {});
    
    return { retry: false };
  }

}