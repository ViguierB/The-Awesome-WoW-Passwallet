import React from "react";
import { Component } from "react";
import AccountLaunchList from "../components/account-launch-list";
import './home.css';

class IdGenerator {
  private _lastid = 0;

  public get() { return ++this._lastid; }
}

const gen = new IdGenerator();

const accounts = [
  { name: 'Account 1' },
  { name: 'Account 2' },
  { name: 'Account 3' }
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