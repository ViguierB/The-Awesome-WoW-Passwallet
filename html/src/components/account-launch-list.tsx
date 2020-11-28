import React from "react";
import { Component } from "react";
import AccountLaunchItem, { AccountLaunchItemPropsBase } from "./account-launch-item";

type AccountLaunchListProps = {
  items: Array<AccountLaunchItemPropsBase & { key: number }>
}

type AccountLaunchListState = {
  isDragging: boolean
}

export default class AccountLaunchList extends Component<AccountLaunchListProps, AccountLaunchListState> {

  private _isDraggingIndex = 0;
  private _isDraggingFitter?: (fitYValue: number) => void;

  constructor(props: AccountLaunchListProps) {
    super(props);

    this.state = {
      isDragging: false
    }
  }

  render() {
    return (
      <ul style={{
        margin: 0,
        padding: 0,
      }}>{
        this.props.items.sort((a, b) => a.index - b.index).map(item => (
          <li style={{
            listStyleType: 'none',
            margin: '15px 5px',
            position: 'relative'
          }} key={item.key}>
            <AccountLaunchItem onDraggingStart={(fitterY) => {
              this._isDraggingFitter = fitterY;
              this._isDraggingIndex = item.index;
              this.setState({ isDragging: true });
            }} onDraggingEnd={() => {
              this.setState({ isDragging: false });
            }} onDragEnter={() => {
              let itemIndexStart = this._isDraggingIndex;
              let itemIndexTo = this._isDraggingIndex = item.index;

              let i1 = this.props.items.findIndex(item => item.index === itemIndexStart);
              let i2 = this.props.items.findIndex(item => item.index === itemIndexTo);
              let tmp = this.props.items[i1].index;
              this.props.items[i1].index = this.props.items[i2].index;
              this.props.items[i2].index = tmp

              this._isDraggingFitter?.call(null, (45 + 15) * (itemIndexStart < itemIndexTo ? 1 : -1) );
              
              this.forceUpdate();
            }} name={ item.name } email={ item.email } isDragging={this.state.isDragging} index={item.index} />
          </li>
        ))
      }</ul>
    );
  }

}