import DBController from './db_controller';

export const controllerType = 'user-defined';

// TODO: link this to the front and ask user for a password
export default class DBControllerUserPassword extends DBController {

  private _password: string = '';

  public setPassword(pass: string) { this._password = pass; }

  protected getType() { return controllerType }

  protected async getSecret() {
    return this._password;
  }

}