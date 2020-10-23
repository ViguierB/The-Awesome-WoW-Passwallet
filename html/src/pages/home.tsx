import React from "react";
import { Component } from "react";
import AccountLaunchList from "../components/account-launch-list";
import gen from '../misc/very-simple-key-generator';
import './home.css';

const accounts = [
  { name: 'Account 1' },
  { name: 'Account 2' },
  { name: 'Account 3' },
  { name: 'Account 4' },
  { name: 'Account 5' },
  { name: 'Account 6' }
].map(i => Object.assign(i, { key: gen.get() }));

export class Home extends Component {

  render() {
    return <div id="home-page">
      <div id='accounts-container'>
        <AccountLaunchList items={ accounts } />
      </div>
    </div>
  }

}