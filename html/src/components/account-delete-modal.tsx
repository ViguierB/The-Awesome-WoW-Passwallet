import React from "react";
import { Component } from "react";
import modalService from '../services/modal-service';
import { ReactComponent as CloseIcon } from "../assets/close.svg";
import { ReactComponent as AskIcon } from "../assets/ask.svg";
import "./account-delete-modal.css";
import dbService from '../services/db-service';

type AccountDeleteModalProps = {
  item?: { name: string } | null
}

export default class AccountDeleteModal extends Component<AccountDeleteModalProps, {}> {

  private onDeleteClicked() {
    dbService.removeUser(this.props.item?.name || '')
      .then(() => { modalService.closeModal(); })
  }

  render() {
    return (
      <div id="modal-delete-account">
        <header>
          <span className="modal-title">
            Delete account
          </span>
          <div className="modal-close" onClick={modalService.closeModal.bind(modalService)}>
            <CloseIcon className='icon' />
          </div>
        </header>
        <div className='modal-body'>
          <AskIcon className='ask-icon' />
          <span>
            Are you sure ? delete '{this.props.item?.name}'
          </span>
        </div>

        <footer>
          <div className='footer-button cancel'
            onClick={modalService.closeModal.bind(modalService)}
          >Cancel</div> 
          <div className='footer-button delete'
            onClick={this.onDeleteClicked.bind(this)}
          >Delete</div>
        </footer>
      </div>
    )
  }

}