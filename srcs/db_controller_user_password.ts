import DBController from './db_controller';


// TODO: link this to the front and ask user for a password
export default class DBControllerUserPassword extends DBController {

  protected async getSecret() {
    return "1234"
  }

}