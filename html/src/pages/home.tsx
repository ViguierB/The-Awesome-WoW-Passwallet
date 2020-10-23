import React from "react";
import { Component } from "react";
import AccountLaunchList from "../components/account-launch-list";
import gen from '../misc/very-simple-key-generator';
import { ReactComponent as AddIcon } from "../assets/add.svg";
import './home.css';
import modalService from '../services/modal-service';
import AccountModal from '../components/account-modal';

const accounts = [
  { name: 'Account 1' },
  { name: 'Account 2' },
  { name: 'Account 3' },
  { name: 'Account 4' },
  { name: 'Account 5' },
  { name: 'Account 6' }
].map(i => Object.assign(i, { key: gen.get() }));

export class Home extends Component {

  onAddButtonClicked() {
    modalService.openModal(<AccountModal item={null} />).then(() => {
      
    })
  }

  render() {
    return <div id="home-page">
      <div id='accounts-container'>
        <AccountLaunchList items={ accounts } />
      </div>
      <div className='button-add' onClick={ this.onAddButtonClicked.bind(this) }>
        <AddIcon className='icon' />
      </div>
    </div>
  }

}