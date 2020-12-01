import React, { Component, CSSProperties } from "react";
import { ReactComponent as ImportIcon } from "../assets/import.svg";
import { ReactComponent as ExportIcon } from "../assets/export.svg";
import './settings-accounts.css'
import modalService from "../services/modal-service";
import AccountModalImportExport from "./account-import-export-modal";

type SettingsItemAccountsProps = {
 
}

type SettingsItemAccountsState = {
  
}

export default class SettingsItemAccounts extends Component<SettingsItemAccountsProps, SettingsItemAccountsState> {

  constructor(props: SettingsItemAccountsProps) {
    super(props);

    this.state = {
    }
  }

  componentDidUpdate(prevProps: SettingsItemAccountsProps) {
    
  }

  render() {
    const iconStyle: CSSProperties = {
      width: '22px',
      fill: 'white',
      margin: 'auto 15px auto auto'
    }


    return (
      <div className="settings-field accounts">
        <label> Accounts: </label>
        <footer>
          <div className='footer-button'
            onClick={() => modalService.openModal(<AccountModalImportExport action='import' />)}
          > <ImportIcon style={iconStyle} /> <div style={{margin: 'auto auto auto 0'}}> Import </div> </div> 
          <div className='footer-button'
            onClick={() => modalService.openModal(<AccountModalImportExport action='export' />)}
          > <ExportIcon style={iconStyle} /> <div style={{margin: 'auto auto auto 0'}}> Export</div> </div>
        </footer>
      </div>
    );
  }

}