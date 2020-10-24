import React from "react";
import { Component } from "react";
import AccountLaunchItem, { AccountLaunchItemProps } from "./account-launch-item";

type AccountLaunchListProps = {
  items: Array<AccountLaunchItemProps & { key: number }>
}

export default class AccountLaunchList extends Component<AccountLaunchListProps, {}> {

  render() {
    return (
      <ul style={{
        margin: 0,
        padding: 0,
      }}>{
        this.props.items.map(item => (
          <li style={{
            listStyleType: 'none',
            margin: '15px 5px'
          }} key={item.key}>
            <AccountLaunchItem name={ item.name } email={ item.email } />
          </li>
        ))
      }</ul>
    );
  }

}