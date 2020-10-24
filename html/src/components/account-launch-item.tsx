import React from "react";
import { Component } from "react";
import "./account-launch-item.css";
import deleteIcon from "../assets/delete.svg";
import { ReactComponent as DeleteIcon } from "../assets/delete.svg";
import { ReactComponent as EditIcon } from "../assets/edit.svg";
import { ReactComponent as PlayIcon } from "../assets/play.svg";
import modalService from '../services/modal-service';
import AccountModal from "./account-modal";

export type AccountLaunchItemProps = {
  name: string
};

export default class AccountLaunchItem extends Component<AccountLaunchItemProps, {}> {

  onEditButtonClicked() {
    modalService.openModal(<AccountModal item={this.props.name} />).then(() => {
      
    })
  }

  render() {
    return (
      <div className='pw-account-item'>
        <div className='main-container'>
          <div className='text-container'>
            <div className='container-left-button'>
              <div className='icon-container delete-button'>
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