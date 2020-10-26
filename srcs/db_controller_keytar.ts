import DBController from './db_controller';
import * as os from 'os';
import * as keytar from 'keytar';
import * as crypto from 'crypto';

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

}