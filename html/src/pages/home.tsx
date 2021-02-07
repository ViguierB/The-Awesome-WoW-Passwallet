import React from "react";
import { Component } from "react";
import AccountLaunchList from "../components/account-launch-list";
import gen from '../misc/very-simple-key-generator';
import { ReactComponent as AddIcon } from "../assets/add.svg";
import { ReactComponent as RightArrowIcon } from "../assets/right-arrow.svg";
import './home.css';
import modalService from '../services/modal-service';
import settingsService from '../services/settings-service';
import AccountModal from '../components/account-modal';
import dbService from '../services/db-service';
import DropDownMenu, { DropDownMenuItem } from '../components/drop-down-menu';

type HomeState = {
  accounts: ({ name: string, email: string, index: number } & { key: number })[],
  ready: boolean,
}

export class Home extends Component<{}, HomeState> {

  private _menuInitialValue: string = '';

  constructor(props: any) {
    super(props);

    this.state = { accounts: [], ready: false };
  }

  componentDidMount() {
    dbService.dbOpened.subcribe(this.onDbChange.bind(this));
    dbService.dbEdited.subcribe(this.onDbChange.bind(this));
    
    Promise.all([
      this.onDbChange(),
      settingsService.getSettings().then((s: any) => {
        this._menuInitialValue = s['selectedExtension'];
        return s;
      })
    ]).then(() => {
      this.setState({ ready: true });
    });
  }

  private async onDbChange() {
    const accounts = await dbService.getDB();
    this.setState({ accounts: accounts.map(i => Object.assign(i, {
      key: this.state.accounts.find(a => a.name === i.name)?.key || gen.get()
    })) });
  }

  onAddButtonClicked() {
    modalService.openModal(<AccountModal item={null} />).then(() => {})
  }

  render() {
    if (this.state.ready === false) {
      return null
    }

    return <div id="home-page">
      <div id='accounts-container'>
        <AccountLaunchList items={ this.state.accounts } onSortingChange={(sorting) => {
          dbService.updateSorting(sorting).then(() => {});
        }} />
      </div>
      <div className='button-add' onClick={ this.onAddButtonClicked.bind(this) }>
        { (this.state.accounts.length === 0) ? (
            <div className='empty-list'>
              <span> Click here </span>
              <RightArrowIcon className='arrow-icon' />
            </div>
          ) : null 
        }
        <AddIcon className='icon' />
      </div>
      <DropDownMenu initialValue={this._menuInitialValue} onValueChange={(v) => {
        settingsService.updateSettings({ selectedExtension: v }, false);
      }}>
        <DropDownMenuItem value="retail">
          Retail
        </DropDownMenuItem>
        <DropDownMenuItem value="classic">
          Classic
        </DropDownMenuItem>
      </DropDownMenu>
    </div>
  }

}