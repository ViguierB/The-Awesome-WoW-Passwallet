import React from "react";
import { Component } from "react";
import "./account-launch-item.css";
import { ReactComponent as DeleteIcon } from "../assets/delete.svg";
import { ReactComponent as EditIcon } from "../assets/edit.svg";
import { ReactComponent as PlayIcon } from "../assets/play.svg";
import modalService from '../services/modal-service';
import AccountModal from "./account-modal";
import AccountDeleteModal from "./account-delete-modal";
import executorService from '../services/executor-service';

export type AccountLaunchItemProps = {
  name: string, email: string
};

export default class AccountLaunchItem extends Component<AccountLaunchItemProps, { launchInProgress: boolean }> {

  constructor(props: AccountLaunchItemProps) {
    super(props);

    this.state = {
      launchInProgress: false
    }
  }

  onEditButtonClicked() {
    modalService.openModal(<AccountModal item={this.props} />).then(() => {});
  }

  onDeleteButtonClicked() {
    modalService.openModal(<AccountDeleteModal item={this.props} />).then(() => {});
  }

  onStartButtonClicked() {
    if (this.state.launchInProgress) { return; }
    this.setState({
      launchInProgress: true
    })
    executorService.launchWowForUser(this.props.name).then(() => {
      this.setState({
        launchInProgress: false
      });
    });
  }

  // onStartButtonClicked() {
  //   this.setState({
  //     launchInProgress: !this.state.launchInProgress
  //   })
  // }

  render() {
    return (
      <div className='pw-account-item'>
        <div className='main-container'>
          <div className='text-container'>
            <div className='container-left-button'>
              <div className='icon-container delete-button' onClick={() => this.onDeleteButtonClicked()}>
                <DeleteIcon className='icon delete-icon'/>
              </div>
              <div className='icon-container edit-button' onClick={() => this.onEditButtonClicked()}>
                <EditIcon className='icon edit-icon'/>
              </div>
            </div>
            <span> { this.props.name } </span>
          </div>
          <div className='icon-container play-button' onClick={() => this.onStartButtonClicked()}>
            <PlayIcon className={(this.state.launchInProgress ? 'hidden' : '') + ' icon play-icon hide-anim'} />
            <div className={(this.state.launchInProgress ? '' : 'hidden') + ' loader hide-anim'}>
              <div className='lds-ellipsis'>
                <div></div><div></div><div></div><div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

}