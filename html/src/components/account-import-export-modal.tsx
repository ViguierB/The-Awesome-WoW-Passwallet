import React from "react";
import { Component } from "react";
import modalService from '../services/modal-service';
import { ReactComponent as CloseIcon } from "../assets/close.svg";
import dbService from '../services/db-service';
import toastService from '../services/toast-service';
import "./account-import-export-modal.css";
import miscService from '../services/misc-service';

type AccountModalImportExportProps = {
  action: 'import' | 'export'
}

type AccountModalImportExportState = {
  path: string,
  password: string,
  merge: boolean
}

export default class AccountModalImportExport extends Component<AccountModalImportExportProps, AccountModalImportExportState> {

  constructor(props: AccountModalImportExportProps) {
    super(props);

    this.state = {
      path: '',
      password: '',
      merge: this.props.action === 'import'
    }
  }

  private onFieldChange(fieldName: 'path' | 'password', event: any) {
    this.setState({ [fieldName]: event.target.value } as any);
  }

  private onSubmit(event: any) {
    event?.preventDefault();

    dbService[(this.props.action === 'import') ? 'importDB' : 'exportDB'](
      this.state.path, this.state.password, this.state.merge
    ).then((r) => {
      if (!!r && !!r.error) {
        toastService.showMessage(null, r.message, 'error');
        return;
      }
      toastService.showMessage(this.props.action, (this.props.action === 'import') 
        ? 'Accounts import successfully'
        : 'Accounts export successfully'
      , 'message');
      modalService.closeModal();
    });

  }

  private openFileDialog(action: 'import' | 'export') {
    miscService[action === 'import' ? 'openFileDialog' : 'saveFileDialog']({
      properties: ['openFile'],
      filters: action === 'import' ? [
        { name: 'All', extensions: ['*'] },
        { name : 'Passwallet file', extensions: ['awesomedb'] }
      ] : []
    }).then((f: any) => {
      if (!f || !f.file) { return; }
      this.setState({ path: f.file });
    })
  }

  render() {
    return (
      <div id="modal-account-import">
        <form onSubmit={this.onSubmit.bind(this)}>
          <header>
            <span className="modal-title">
              { ((this.props.action === 'import') ? "Import accounts" : "Export accounts").toUpperCase() }
            </span>
            <div className="modal-close button" onClick={modalService.closeModal.bind(modalService)}>
              <CloseIcon className='icon' />
            </div>
          </header>
          <div className='modal-body' style={{ width: '350px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              width: '100%',
            }}>
              <input type='text' placeholder='path' style={{ width: '100%' }}
                value={this.state?.path || ''} onChange={this.onFieldChange.bind(this, 'path')}
              />
              <label style={{
                marginLeft: '5px',
                backgroundColor: '#2f2f2f',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor:'pointer',
              }} onClick={ this.openFileDialog.bind(this, this.props.action) }>...</label>
            </div>
            <input type='password' placeholder='password' autoFocus
              value={this.state?.password || ''} onChange={this.onFieldChange.bind(this, 'password')}
            />
            {
              (this.props.action === 'import')
                ? (<div style={{ display: 'flex' }}>
                    <input type="checkbox" id="merge-checkbox" name="merge-checkbox"
                      onChange={() => this.setState({ merge: !this.state.merge })}
                      defaultChecked={this.state.merge}
                    />
                    <label style={{ marginLeft: '10px' }} htmlFor="merge-checkbox"> Merge with existing accounts ? </label>
                  </div>)
                : null
            }
          </div>

          <footer>
            <div className='footer-button button'
              onClick={modalService.closeModal.bind(modalService)}
            > Cancel </div> 
            <input className='footer-button button' type='submit'
              value={(this.props.action === 'import') ? "Import" : "Export"}
            />
          </footer>
        </form>
      </div>
    )
  }

}