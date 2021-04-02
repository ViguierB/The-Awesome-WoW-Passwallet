import React from "react";
import { Component } from "react";
import AccountLaunchItem, { AccountLaunchItemPropsBase } from "./account-launch-item";

type AccountLaunchListProps = {
  items: Array<AccountLaunchItemPropsBase & { key: number }>,
  onSortingChange: (sorting: { name: string, index: number }[]) => void
}

type AccountLaunchListState = {
  isDragging: boolean
}

export default class AccountLaunchList extends Component<AccountLaunchListProps, AccountLaunchListState> {

  private _isDraggingIndex = 0;

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
        display: 'flex',
        flexDirection: 'column'
      }}>{
        this.props.items.sort((a, b) => a.index - b.index).map(item => (
          <li style={{
            listStyleType: 'none',
            marginTop: '7px',
            marginBottom: '7px',
            position: 'relative'
          }} key={item.key}>
            <AccountLaunchItem onDraggingStart={() => {
              this._isDraggingIndex = item.index;
              this.setState({ isDragging: true });
            }} onDraggingEnd={() => {
              this.setState({ isDragging: false });
              this.props.onSortingChange(this.props.items.map(it => ({ name: it.name, index: it.index })))
            }} onIndexChange={(increment) => {
              let itemIndexStart = item.index;
              let itemIndexTo = item.index + increment;

              let i1 = this.props.items.findIndex(it => it.index === itemIndexStart);
              let i2 = this.props.items.findIndex(it => it.index === itemIndexTo);

              if (i1 === -1 || i2 === -1) {
                return;
              }

              let tmp = this.props.items[i1].index;
              this.props.items[i1].index = this.props.items[i2].index;
              this.props.items[i2].index = tmp
              
              this.forceUpdate();
            }} name={ item.name } email={ item.email } infos={ item.infos } isDragging={this.state.isDragging} index={item.index} />
          </li>
        ))
      }</ul>
    );
  }

}