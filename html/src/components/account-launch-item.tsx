import React from "react";
import { Component } from "react";
import "./account-launch-item.css";
import { ReactComponent as DeleteIcon } from "../assets/delete.svg";
import { ReactComponent as EditIcon } from "../assets/edit.svg";
import { ReactComponent as PlayIcon } from "../assets/play.svg";
import modalService from '../services/modal-service';
import AccountModal from "./account-modal";
import AccountDeleteModal from "./account-delete-modal";

export type AccountLaunchItemProps = {
  name: string, email: string
};

export default class AccountLaunchItem extends Component<AccountLaunchItemProps, {}> {

  onEditButtonClicked() {
    modalService.openModal(<AccountModal item={this.props} />).then(() => {});
  }

  onDeleteButtonClicked() {
    modalService.openModal(<AccountDeleteModal item={this.props} />).then(() => {});
  }

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
          <div className='icon-container play-button'>
            <PlayIcon className='icon play-icon'/>
          </div>
        </div>
      </div>
    )
  }

}