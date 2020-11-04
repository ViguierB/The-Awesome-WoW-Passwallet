import React from "react";
import { Component } from "react";
import AccountLaunchList from "../components/account-launch-list";
import gen from '../misc/very-simple-key-generator';
import { ReactComponent as AddIcon } from "../assets/add.svg";
import { ReactComponent as RightArrowIcon } from "../assets/right-arrow.svg";
import './home.css';
import modalService from '../services/modal-service';
import AccountModal from '../components/account-modal';
import dbService from '../services/db-service';
import toastService from '../services/toast-service';

type HomeState = {
  accounts: ({ name: string, email: string } & { key: number })[],
  ready: boolean,
}

export class Home extends Component<{}, HomeState> {

  constructor(props: any) {
    super(props);

    this.state = { accounts: [], ready: false };

    dbService.dbOpened.subcribe(this.onDbChange.bind(this));
    dbService.dbEdited.subcribe(this.onDbChange.bind(this));
    this.onDbChange(null).then(() => {
      this.setState({ ready: true });
    });
  }

  private onDbChange(_handle: any) {
    return dbService.getDB().then(accounts => {
      this.setState({ accounts: accounts.map(i => Object.assign(i, { key: gen.get() })) });
    });
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
        <AccountLaunchList items={ this.state.accounts } />
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
    </div>
  }

}